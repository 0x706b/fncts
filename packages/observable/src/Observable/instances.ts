// import type * as HKT from "@principia/base/HKT";
// import * as P from "@principia/base/prelude";
// import * as O from "./core.js";
// export interface ObservableF extends HKT.HKT {
//   readonly type: O.Observable<this["E"], this["A"]>;
//   readonly index: number;
//   readonly variance: {
//     E: "+";
//     A: "+";
//   };
// }
// export const Functor: P.Functor<ObservableF> = P.Functor({
//   map_: O.map_,
// });
// export const FunctorWithIndex: P.FunctorWithIndex<ObservableF> = P.FunctorWithIndex({
//   imap_: O.mapWithIndex,
// });
// export const SemimonoidalFunctor: P.SemimonoidalFunctor<ObservableF> = P.SemimonoidalFunctor({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
// });
// export const Apply: P.Apply<ObservableF> = P.Apply({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
//   ap_: O.ap_,
// });
// export const apS = P.apSF(Apply);
// export const apT = P.apTF(Apply);
// export const sequenceS = P.sequenceSF(Apply);
// export const sequenceT = P.sequenceTF(Apply);
// export const MonoidalFunctor: P.MonoidalFunctor<ObservableF> = P.MonoidalFunctor({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
//   unit: O.unit,
// });
// export const Applicative: P.Applicative<ObservableF> = P.Applicative({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
//   unit: O.unit,
//   pure: O.pure,
// });
// export const Monad: P.Monad<ObservableF> = P.Monad({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
//   unit: O.unit,
//   pure: O.pure,
//   chain_: O.concatMap_,
//   flatten: O.flatten,
// });
// const _do = O.pure({});
// export { _do as do };
// export const chainS_ = P.chainSF_(Monad);
// export const chainS = P.chainSF(Monad);
// export const pureS_ = P.pureSF_(Monad);
// export const pureS = P.pureSF(Monad);
// export const MonadSwitch: P.Monad<ObservableF> = P.Monad({
//   map_: O.map_,
//   cross_: O.cross_,
//   crossWith_: O.crossWith_,
//   unit: O.unit,
//   pure: O.pure,
//   chain_: O.switchMap_,
//   flatten: O.switchFlatten,
// });
// export const Filterable: P.Filterable<ObservableF> = P.Filterable({
//   map_: O.map_,
//   filter_: O.filter_,
//   filterMap_: O.filterMap_,
//   partition_: O.partition_,
//   partitionMap_: O.partitionMap_,
// });
// export const FilterableWithIndex: P.FilterableWithIndex<ObservableF> = P.FilterableWithIndex({
//   imap_: O.mapWithIndex,
//   ifilter_: O.ifilter_,
//   ifilterMap_: O.filterMapWithIndex,
//   ipartition_: O.partitionWithIndex,
//   ipartitionMap_: O.partitionMapWithIndex_,
// });
