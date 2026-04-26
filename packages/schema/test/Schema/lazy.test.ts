import type { Lazy } from "@fncts/schema/AST";

import { TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema lazy", () => {
  test("success - recursive schema", () => {
    interface Category {
      readonly name: string;
      readonly subcategories: ReadonlyArray<Category>;
    }

    const Category: Schema<Category> = Schema.lazy<Category>(() =>
      Schema.struct({
        name: Schema.string,
        subcategories: Schema.array(Category),
      }),
    );

    expectSuccess(
      Category,
      { name: "root", subcategories: [{ name: "child", subcategories: [] }] },
      { name: "root", subcategories: [{ name: "child", subcategories: [] }] },
    );
  });

  test("success - deeply nested", () => {
    interface Category {
      readonly name: string;
      readonly subcategories: ReadonlyArray<Category>;
    }

    const Category: Schema<Category> = Schema.lazy<Category>(() =>
      Schema.struct({
        name: Schema.string,
        subcategories: Schema.array(Category),
      }),
    );

    const deep = {
      name: "a",
      subcategories: [
        {
          name: "b",
          subcategories: [{ name: "c", subcategories: [] }],
        },
      ],
    };

    expectSuccess(Category, deep, deep);
  });

  test("failure - wrong type in recursive field", () => {
    interface Category {
      readonly name: string;
      readonly subcategories: ReadonlyArray<Category>;
    }

    const Category: Schema<Category> = Schema.lazy<Category>(() =>
      Schema.struct({
        name: Schema.string,
        subcategories: Schema.array(Category),
      }),
    );

    const result = Category.decode({ name: 123, subcategories: [] }).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(9));
  });

  test("failure - not an object", () => {
    interface Category {
      readonly name: string;
      readonly subcategories: ReadonlyArray<Category>;
    }

    const Category: Schema<Category> = Schema.lazy<Category>(() =>
      Schema.struct({
        name: Schema.string,
        subcategories: Schema.array(Category),
      }),
    );

    expectFailure(Category, "not an object", TypeError(AST.unknownRecord, "not an object"));
  });
});
