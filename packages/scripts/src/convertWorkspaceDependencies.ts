import type { Project, Workspace } from "@yarnpkg/core";

import { structUtils } from "@yarnpkg/core";

const DEPENDENCY_TYPE = ["dependencies", "peerDependencies"];

const WORKSPACE_PROTOCOL = "workspace:";

export function convertWorkspaceDependencies(rawManifest: any, project: Project, workspace: Workspace): void {
  for (const dependencyType of DEPENDENCY_TYPE) {
    for (const descriptor of workspace.manifest.getForScope(dependencyType).values()) {
      const matchingWorkspace = project.tryWorkspaceByDescriptor(descriptor);
      const range             = structUtils.parseRange(descriptor.range);
      if (range.protocol !== WORKSPACE_PROTOCOL) {
        continue;
      }

      if (matchingWorkspace === null) {
        if (project.tryWorkspaceByIdent(descriptor) === null) {
          throw new Error(`Workspace not found: ${structUtils.prettyDescriptor(project.configuration, descriptor)}`);
        }
      } else {
        let versionToWrite: string;
        if (
          structUtils.areDescriptorsEqual(descriptor, matchingWorkspace.anchoredDescriptor) ||
          range.selector === "*"
        ) {
          versionToWrite = matchingWorkspace.manifest.version ?? "0.0.0";
        } else if (range.selector === "~" || range.selector === "^") {
          versionToWrite = `${range.selector}${matchingWorkspace.manifest.version ?? "0.0.0"}`;
        } else {
          versionToWrite = range.selector;
        }
        const identDescriptor =
          dependencyType === "dependencies" ? structUtils.makeDescriptor(descriptor, "unknown") : null;
        const finalDependencyType =
          identDescriptor !== null && workspace.manifest.ensureDependencyMeta(identDescriptor).optional
            ? "optionalDependencies"
            : dependencyType;

        rawManifest[finalDependencyType][structUtils.stringifyIdent(descriptor)] = versionToWrite;
      }
    }
  }
}
