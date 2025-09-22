# Limitations of the compiler

Here is a list of Haskell features for which the Clash compiler has only _limited_ support (for now):

* __Recursively defined functions__

    At first hand, it seems rather bad that a compiler for a functional language cannot synthesize recursively defined functions to circuits.
    However, when viewing your functions as a _structural_ specification of a circuit, this _feature_ of the Clash compiler makes sense.
    Also, only certain types of recursion are considered non-synthesizable; recursively defined values are for example synthesizable: they are (often) synthesized to feedback loops.

    Let us distinguish between three variants of recursion:

    * __Dynamic data-dependent recursion__

        As demonstrated in this definition of a function that calculates the n'th Fibbonacci number:

        ``` haskell
        fibR 0 = 0
        fibR 1 = 1
        fibR n = fibR (n-1) + fibR (n-2)
        ```

        To get the first 10 numbers, we do the following:

        ```
        >>> import qualified Data.List as L
        >>> L.map fibR [0..9]
        [0,1,1,2,3,5,8,13,21,34]
        ```

        The `fibR` function is not synthesizable by the Clash compiler, because, when we take a _structural_ view, `fibR` describes an infinitely deep structure.

        In principle, descriptions like the above could be synthesized to a circuit, but it would have to be a _sequential_ circuit.
        Where the most general synthesis would then require a stack.
        Such a synthesis approach is also known as _behavioral_ synthesis, something which the Clash compiler simply does not do.
        One reason that Clash does not do this is because it does not fit the paradigm that only functions working on values of type `Signal` result in sequential circuits, and all other (non higher-order) functions result in combinational circuits.
        This paradigm gives the designer the most straightforward mapping from the original Haskell description to generated circuit, and thus the greatest control over the eventual size of the circuit and longest propagation delay.

    * __Value-recursion__

        As demonstrated in this definition of a function that calculates the n'th Fibbonaci number on the n'th clock cycle:

        ``` haskell
        fibS :: SystemClockResetEnable => Signal System (Unsigned 64)
        fibS = r
            where r = register 0 r + register 0 (register 1 r)
        ```

        To get the first 10 numbers, we do the following:

        ```
        >>> sampleN @System 11 fibS
        [0,0,1,1,2,3,5,8,13,21,34]
        ```

        Unlike the `fibR` function, the above `fibS` function _is_ synthesizable by the Clash compiler.
        Where the recursively defined (non-function) value _r_ is synthesized to a feedback loop containing three registers and one adder.

        Note that not all recursively defined values result in a feedback loop.
        An example that uses recursively defined values which does not result in a feedback loop is the following function that performs one iteration of bubble sort:

        ``` haskell
        sortV xs = map fst sorted :< (snd (last sorted))
          where
            lefts  = head xs :> map snd (init sorted)
            rights = tail xs
            sorted = zipWith compareAndSwap (lazyV lefts) rights

        compareAndSwap a b = if a < b then (a,b) else (b,a)
        ```

        Where we can clearly see that `lefts` and `sorted` are defined in terms of each other.
        Also the above `sortV` function _is_ synthesizable.

    * __Static/Structure-dependent recursion__

        Static, or, structure-dependent recursion is a rather _vague_ concept.
        What we mean by this concept are recursive definitions where a user can sensibly imagine that the recursive definition can be completely unfolded (all recursion is eliminated) at compile-time in a finite amount of time.

        Such definitions would e.g. be:

        ``` haskell
        mapV :: (a -> b) -> Vec n a -> Vec n b
        mapV _ Nil         = Nil
        mapV f (Cons x xs) = Cons (f x) (mapV f xs)

        topEntity :: Vec 4 Int -> Vec 4 Int
        topEntity = mapV (+1)
        ```

        Where one can imagine that a compiler can unroll the definition of `mapV` four times, knowing that the `topEntity` function applies `mapV` to a `Vec` of length 4.
        Sadly, the compile-time evaluation mechanisms in the Clash compiler are very poor, and a user-defined function such as the `mapV` function defined above, is _currently_ not synthesizable.
        We _do_ plan to add support for this in the future.
        In the mean time, this poor support for user-defined recursive functions is amortized by the fact that the Clash compiler has built-in support for the higher-order functions defined in `Clash.Sized.Vector`.
        Most regular design patterns often encountered in circuit design are captured by the higher-order functions in `Clash.Sized.Vector`.

* __Recursive datatypes__

    The Clash compiler needs to be able to determine a bit-size for any value that will be represented in the eventual circuit.
    More specifically, we need to know the maximum number of bits needed to represent a value.
    While this is trivial for values of the elementary types, sum types, and product types, putting a fixed upper bound on recursive types is not (always) feasible.
    This means that the ubiquitous list type is unsupported!
    The only recursive types that are currently supported by the Clash compiler is the `Vec`tor and `RTree` types, for which the compiler has hard-coded knowledge.

    For "easy" `Vec`tor literals you should use Template Haskell splices and the `listToVecTH` _meta_-function.

* __GADTs__

    Clash has experimental support for GADTs.
    Similar to recursive types, Clash cannot determine bit-sizes of GADTs.
    Notable exceptions to this rule are `Vec` and `RTree`.
    You can still use your own GADTs, as long as they can be removed through static analysis.
    For example, the following case will be optimized away and is therefore fine to use:

    ``` haskell
    x =
      case resetKind @System of
        SAsynchronous -> 'a'
        SSynchronous -> 'b'
    ```

* __Floating point types__

    There is no support for the `Float` and `Double` types, if you need numbers with a _fractional_ part you can use the `Fixed` point type.

    As to why there is no support for these floating point types:

    1.  In order to achieve reasonable operating frequencies, arithmetic circuits for floating point data types must be pipelined.
    2.  Haskell's primitive arithmetic operators on floating point data types, such as `plusFloat#`

        ``` haskell
        plusFloat# :: Float# -> Float# -> Float#
        ```

        which underlie `Float`'s `Num` instance, must be implemented as purely combinational circuits according to their type.
        Remember, sequential circuits operate on values of type `Signal dom a`.

    Although it is possible to implement purely combinational (not pipelined) arithmetic circuits for floating point data types, the circuit would be unreasonable slow.
    So, without synthesis possibilities for the basic arithmetic operations, there is no point in supporting the floating point data types.

* __Haskell primitive types__

    Only the following primitive Haskell types are supported:

    * `Integer`
    * `Int`
    * `Int8`
    * `Int16`
    * `Int32`
    * `Int64` (not available when compiling with `-fclash-intwidth=32` on a 64-bit machine)
    * `Word`
    * `Word8`
    * `Word16`
    * `Word32`
    * `Word64` (not available when compiling with `-fclash-intwidth=32` on a 64-bit machine)
    * `Char`

    There are several aspects of which you should take note:

    * `Int` and `Word` are represented by the same number of bits as is native for the architecture of the computer on which the Clash compiler is executed.
      This means that if you are working on a 64-bit machine, `Int` and `Word` will be 64-bit.
      This might be problematic when you are working in a team, and one designer has a 32-bit machine, and the other has a 64-bit machine.
      In general, you should be avoiding 'Int' in such cases, but as a band-aid solution, you can force the Clash compiler to use a specific bit-width for `Int` and `Word` using the `-fclash-intwidth=N` flag, where _N_ must either be _32_ or _64_.

    * When you use the `-fclash-intwidth=32` flag on a _64-bit_ machine, the 'Word64' and 'Int64' types _cannot_ be translated. This restriction does _not_ apply to the other three combinations of `-fclash-intwidth` flag and machine type.

    * The translation of 'Integer' is not meaning-preserving.
      'Integer' in Haskell is an arbitrary precision integer, something that cannot be represented in a statically known number of bits.
      In the Clash compiler, we chose to represent 'Integer' by the same number of bits as we do for `Int` and `Word`.
      As you have read in a previous bullet point, this number of bits is either 32 or 64, depending on the architecture of the machine the Clash compiler is running on, or the setting of the `-fclash-intwidth` flag.

      Consequently, you should use `Integer` with due diligence; be especially careful when using `fromIntegral` as it does a conversion via 'Integer'.
      For example:

      ``` haskell
      signedToUnsigned :: Signed 128 -> Unsigned 128
      signedToUnsigned = fromIntegral
      ```

      can either lose the top 64 or 96 bits depending on whether `Integer` is represented by 64 or 32 bits.
      Instead, when doing such conversions, you should use `bitCoerce`:

      ``` haskell
      signedToUnsigned :: Signed 128 -> Unsigned 128
      signedToUnsigned = bitCoerce
      ```

* __Side-effects: `IO`, `ST`, etc.__

    There is no support for side-effecting computations such as those in the `IO` or `ST` monad.
    There is also no support for Haskell's [FFI](http://www.haskell.org/haskellwiki/Foreign_Function_Interface).
