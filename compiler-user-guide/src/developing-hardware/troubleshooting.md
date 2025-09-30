# Troubleshooting

A list of often encountered errors and their solutions:

* __Type error: Couldn't match expected type `Signal dom (a,b)` with actual type `(Signal dom a, Signal dom b)`__:

    Signals of product types and product types of signals are __isomorphic__ due to synchronisity principle, but are not (structurally) equal.
    Tuples are a product type.
    Use the `bundle` function to convert from a product type to the signal type.
    So if your code which gives the error looks like:

    ``` haskell
    ... = f a b (c,d)
    ```

    add the `bundle` function like so:

    ``` haskell
    ... = f a b (bundle (c,d))
    ```

    Product types supported by `bundle` are:

    * All tuples up to and including 62-tuples (GHC limit)
    * The `Vec`tor type

* __Type error: Couldn't match expected type `(Signal dom a, Signal dom b)` with actual type `Signal dom (a,b)`__:

    Product types of signals and signals of product types are __isomorphic__ due to synchronicity principle, but are not (structurally) equal.
    Tuples are a product type.
    Use the `unbundle` function to convert from a signal type to the product type.
    So if your code which gives the error looks like:

    ``` haskell
    (c,d) = f a b
    ```

    add the `unbundle` function like so:

    ``` haskell
    (c,d) = unbundle (f a b)
    ```

    Product types supported by `unbundle` are:

    * All tuples up to and including 62-tuples (GHC limit)
    * The `Vec`tor type

* __Clash.Netlist(..): Not in normal form: \<REASON\>: \<EXPR\>__:

    A function could not be transformed into the expected normal form.
    This usually means one of the following:

    * The `topEntity` has higher-order arguments, or a higher-order result.
    * You are using types which cannot be represented in hardware.

    The solution for all the above listed reasons is quite simple: remove them.
    That is, make sure that the `topEntity` is completely monomorphic and first-order.
    Also remove any variables and constants/literals that have a non-representable type; see [Limitations of Clash](limitations.md) to find out which types are not representable.

* __Clash.Normalize(..): Clash can only normalize monomorphic functions, but this is polymorphic__:

    If this happens for a `topEntity` or something with a `Synthesize` annotation, add a monomorphic type signature.
    Non topEntites should be type-specialized by clash automatically, if not please report this as a bug.
    But adding a monomorphic type signature should still help (when possible).

* __Clash.Normalize(..): Expr belonging to bndr: \<FUNCTION\> remains recursive after normalization__:

    * If you actually wrote a recursive function, rewrite it to a non-recursive one using e.g. one of the higher-order functions in `Clash.Sized.Vector`

    * You defined a recursively defined value, but left it polymorphic:

    ``` haskell
    topEntity x y = acc
      where
        acc = register 3 (acc + x * y)
    ```

    The above function, works for any number-like type.
    This means that `acc` is a recursively defined __polymorphic__ value.
    Adding a monomorphic type annotation makes the error go away:

    ``` haskell
    topEntity
      :: SystemClockResetEnable
      => Signal System (Signed 8)
      -> Signal System (Signed 8)
      -> Signal System (Signed 8)
    topEntity x y = acc
      where
        acc = register 3 (acc + x * y)
    ```

* __Clash.Normalize.Transformations(..): InlineNonRep: \<FUNCTION\> already inlined 100 times in:\<FUNCTION\>, \<TYPE\>__:

    You left the `topEntity` function polymorphic or higher-order: use `:i topEntity` to check if the type is indeed polymorphic or higher-order.
    If it is, add a monomorphic type signature, and/or supply higher-order arguments.

*  __<*** Exception: <\<loop\>> or "blinking cursor"__

    You are using value-recursion, but one of the `Vec`tor functions that you are using is too *strict* in one of the recursive arguments.
    For example:

    ``` haskell
    -- Bubble sort for 1 iteration
    sortV xs = map fst sorted :< (snd (last sorted))
     where
       lefts  = head xs :> map snd (init sorted)
       rights = tail xs
       sorted = zipWith compareSwapL lefts rights

    -- Compare and swap
    compareSwapL a b = if a < b then (a,b) else (b,a)
    ```

    Will not terminate because `zipWith` is too strict in its second argument.

    In this case, adding `lazyV` on `zipWith`s second argument:

    ``` haskell
    sortVL xs = map fst sorted :< (snd (last sorted))
     where
       lefts  = head xs :> map snd (init sorted)
       rights = tail xs
       sorted = zipWith compareSwapL (lazyV lefts) rights
    ```

    Results in a successful computation:

    ```
    clashi> sortVL (4 :> 1 :> 2 :> 3 :> Nil)
    1 :> 2 :> 3 :> 4 :> Nil
    ```
