# User-defined primitives
There are times when you already have an existing piece of IP, or there are times where you need the HDL to have a specific shape so that the HDL synthesis tool can infer a specific component.
In these specific cases you can resort to defining your own HDL primitives.
Actually, most of the primitives in Clash are specified in the same way as you will read about in this section.
There are perhaps 10 (at most) functions which are truly hard-coded into the Clash compiler.
You can take a look at the files in <https://github.com/clash-lang/clash-compiler/tree/master/clash-lib/prims/vhdl> (or <https://github.com/clash-lang/clash-compiler/tree/master/clash-lib/prims/verilog> for the Verilog primitives or <https://github.com/clash-lang/clash-compiler/tree/master/clash-lib/prims/systemverilog> for the SystemVerilog primitives) if you want to know which functions are defined as "regular" primitives.
The compiler looks for primitives in four locations:

* The official install location: e.g.

    * `$HOME/.stack/snapshots/x86_64-linux/<HASH>/share/<GHC_VERSION>/clash-lib-<VERSION>/prims/common`
    * `$HOME/.stack/snapshots/x86_64-linux/<HASH>/share/<GHC_VERSION>/clash-lib-<VERSION>/prims/commonverilog`
    * `$HOME/.stack/snapshots/x86_64-linux/<HASH>/share/<GHC_VERSION>/clash-lib-<VERSION>/prims/systemverilog`
    * `$HOME/.stack/snapshots/x86_64-linux/<HASH>/share/<GHC_VERSION>/clash-lib-<VERSION>/prims/verilog`
    * `$HOME/.stack/snapshots/x86_64-linux/<HASH>/share/<GHC_VERSION>/clash-lib-<VERSION>/prims/vhdl`

* Directories indicated by a `Clash.Annotations.Primitive.Primitive` annotation
* The current directory (the location given by `pwd`)
* The include directories specified on the command-line: `-i<DIR>`

Where redefined primitives in the current directory or include directories will overwrite those in the official install location.
For now, files containing primitive definitions must have a `.primitives.yaml` file-extension.

Clash differentiates between two types of primitives, _expression_ primitives and _declaration_ primitives, corresponding to whether the primitive is an HDL _expression_ or an HDL _declaration_.
We will first explore _expression_ primitives, using `Signed` multiplication (`*`) as an example.
The `Clash.Sized.Internal.Signed` module specifies multiplication as follows:

``` haskell
(*#) :: KnownNat n => Signed n -> Signed n -> Signed n
(S a) *# (S b) = fromInteger_INLINE (a * b)
{-# OPAQUE (*#) #-}
```

For which the VHDL _expression_ primitive is:

``` yaml
BlackBox:
  name: Clash.Sized.Internal.Signed.*#
  kind: Expression
  type: '(*#) :: KnownNat n => Signed n -> Signed n -> Signed n'
  template: resize(~ARG[1] * ~ARG[2], ~LIT[0])
```

The `name` of the primitive is the _fully qualified_ name of the function you are creating the primitive for.
Because we are creating an _expression_ primitive the kind must be set to `Expression`.
As the name suggest, it is a VHDL _template_, meaning that the compiler must fill in the holes heralded by the tilde (~).
Here:

  * `~ARG[1]` denotes the second argument given to the `(*#)` function, which corresponds to the LHS of the (`*`) operator.
  * `~ARG[2]` denotes the third argument given to the `(*#)` function, which corresponds to the RHS of the (`*`) operator.
  * `~LIT[0]` denotes the first argument given to the `(*#)` function, with the extra condition that it must be a `LIT`eral.
    If for some reason this first argument does not turn out to be a literal then the compiler will raise an error.
    This first arguments corresponds to the `KnownNat n` class constraint.


An extensive list with all of the template holes will be given the end of this section. What we immediately notice is that class constraints are counted as normal arguments in the primitive definition.
This is because these class constraints are actually represented by ordinary record types, with fields corresponding to the methods of the type class.
In the above case, `KnownNat` is actually just like a `newtype` wrapper for `Natural`.

The second kind of primitive that we will explore is the _declaration_ primitive.
We will use `blockRam#` as an example, for which the Haskell/Clash code is:

``` haskell
{-# LANGUAGE BangPatterns #-}

module BlockRam where

import Clash.Explicit.Prelude
import Clash.Annotations.Primitive (hasBlackBox)
import Clash.Signal.Internal (Clock, Signal (..), (.&&.))
import Clash.Sized.Vector (Vec, toList)
import Clash.XException (defaultSeqX)

import qualified Data.Vector as V
import GHC.Stack (HasCallStack, withFrozenCallStack)

blockRam#
  :: ( KnownDomain dom
     , HasCallStack
     , NFDataX a )
  => Clock dom           -- ^ Clock to synchronize to
  -> Enable dom          -- ^ Global enable
  -> Vec n a             -- ^ Initial content of the BRAM, also
                         -- determines the size, @n@, of the BRAM.
                         --
                         -- __NB__: __MUST__ be a constant.
  -> Signal dom Int      -- ^ Read address @r@
  -> Signal dom Bool     -- ^ Write enable
  -> Signal dom Int      -- ^ Write address @w@
  -> Signal dom a        -- ^ Value to write (at address @w@)
  -> Signal dom a        -- ^ Value of the BRAM at address @r@ from
                         -- the previous clock cycle
blockRam# (Clock _) gen content rd wen =
  go
    (V.fromList (toList content))
    (withFrozenCallStack (deepErrorX "blockRam: intial value undefined"))
    (fromEnable gen)
    rd
    (fromEnable gen .&&. wen)
 where
  go !ram o ret@(~(re :- res)) rt@(~(r :- rs)) et@(~(e :- en)) wt@(~(w :- wr)) dt@(~(d :- din)) =
    let ram' = d `defaultSeqX` upd ram e (fromEnum w) d
        o'   = if re then ram V.! r else o
    in  o `seqX` o :- (ret `seq` rt `seq` et `seq` wt `seq` dt `seq` go ram' o' res rs en wr din)

  upd ram we waddr d = case maybeIsX we of
    Nothing -> case maybeIsX waddr of
      Nothing -> V.map (const (seq waddr d)) ram
      Just wa -> ram V.// [(wa,d)]
    Just True -> case maybeIsX waddr of
      Nothing -> V.map (const (seq waddr d)) ram
      Just wa -> ram V.// [(wa,d)]
    _ -> ram
{-# OPAQUE blockRam# #-}
{-# ANN blockRam# hasBlackBox #-}
```

And for which the _declaration_ primitive is:

``` yaml
BlackBox:
  name: Clash.Explicit.BlockRam.blockRam#
  kind: Declaration
  type: |-
    blockRam#
      :: ( KnownDomain dom        ARG[0]
         , HasCallStack  --       ARG[1]
         , NFDataX a )   --       ARG[2]
      => Clock dom       -- clk,  ARG[3]
      -> Enable dom      -- en,   ARG[4]
      -> Vec n a         -- init, ARG[5]
      -> Signal dom Int  -- rd,   ARG[6]
      -> Signal dom Bool -- wren, ARG[7]
      -> Signal dom Int  -- wr,   ARG[8]
      -> Signal dom a    -- din,  ARG[9]
      -> Signal dom a
  template: |-
    -- blockRam begin
    ~GENSYM[~RESULT_blockRam][1] : block
      signal ~GENSYM[~RESULT_RAM][2] : ~TYP[5] := ~CONST[5];
      signal ~GENSYM[rd][4]  : integer range 0 to ~LENGTH[~TYP[5]] - 1;
      signal ~GENSYM[wr][5]  : integer range 0 to ~LENGTH[~TYP[5]] - 1;
    begin
      ~SYM[4] <= to_integer(~ARG[6])
      -- pragma translate_off
                    mod ~LENGTH[~TYP[5]]
      -- pragma translate_on
                    ;
      ~SYM[5] <= to_integer(~ARG[8])
      -- pragma translate_off
                    mod ~LENGTH[~TYP[5]]
      -- pragma translate_on
                    ;
    ~IF ~VIVADO ~THEN
      ~SYM[6] : process(~ARG[3])
      begin
        if ~IF~ACTIVEEDGE[Rising][0]~THENrising_edge~ELSEfalling_edge~FI(~ARG[3]) then
          if ~ARG[7] ~IF ~ISACTIVEENABLE[4] ~THEN and ~ARG[4] ~ELSE ~FI then
            ~SYM[2](~SYM[5]) <= ~TOBV[~ARG[9]][~TYP[9]];
          end if;
          ~RESULT <= fromSLV(~SYM[2](~SYM[4]))
          -- pragma translate_off
          after 1 ps
          -- pragma translate_on
          ;
        end if;
      end process; ~ELSE
      ~SYM[6] : process(~ARG[3])
      begin
        if ~IF~ACTIVEEDGE[Rising][0]~THENrising_edge~ELSEfalling_edge~FI(~ARG[3]) then
          if ~ARG[7] ~IF ~ISACTIVEENABLE[4] ~THEN and ~ARG[4] ~ELSE ~FI then
            ~SYM[2](~SYM[5]) <= ~ARG[9];
          end if;
          ~RESULT <= ~SYM[2](~SYM[4])
          -- pragma translate_off
          after 1 ps
          -- pragma translate_on
          ;
        end if;
      end process; ~FI
    end block;
    --end blockRam
```

Again, the `name` of the primitive is the fully qualified name of the function you are creating the primitive for.
Because we are creating a _declaration_ primitive the _kind_ must be set to `Declaration`.
Instead of discussing what the individual template holes mean in the above context, we will instead just give a general listing of the available template holes:

* `~RESULT`: Signal to which the result of a primitive must be assigned to.
  NB: Only used in a _declaration_ primitive.
* `~ARG[N]`: `(N+1)`'th argument to the function.
* `~CONST[N]`: `(N+1)`'th argument to the function.
  Like `~ARG`, but Clash will try to reduce this to a literal, even if it would otherwise consider it too expensive.
  And if Clash fails to reduce this argument to a literal it will produce an error.
* `~LIT[N]`: `(N+1)`'th argument to the function.
  Like `~CONST` but values are rendered as a bare literals, without any size or type annotations.
  This only works for numeric types, and not for BitVector.
* `~TYP[N]`: VHDL type of the `(N+1)`'th argument.
* `~TYPO`: VHDL type of the result.
* `~TYPM[N]`: VHDL type*name* of the `(N+1)`'th argument; used in _type qualification_.
* `~TYPMO`: VHDL type*name* of the result; used in _type qualification_.
* `~ERROR[N]`: Error value for the VHDL type of the `(N+1)`'th argument.
* `~ERRORO`: Error value for the VHDL type of the result.
* `~GENSYM[<NAME>][N]`: Create a unique name, trying to stay as close to the given `<NAME>` as possible.
  This unique symbol can be referred to in other places using `~SYM[N]`.
* `~SYM[N]`: a reference to the unique symbol created by `~GENSYM[<NAME>][N]`.
* `~SIGD[<HOLE>][N]`: Create a signal declaration, using `<HOLE>` as the name of the signal, and the type of the `(N+1)`'th argument.
* `~SIGDO[<HOLE>]`: Create a signal declaration, using `<HOLE>` as the name of the signal, and the type of the result.
* `~TYPEL[<HOLE>]`: The element type of the vector type represented by `<HOLE>`.
  The content of `<HOLE>` must either be: `~TYP[N]`, `~TYPO`, or `~TYPEL[<HOLE>]`.
* `~COMPNAME`: The name of the component in which the primitive is instantiated.
* `~LENGTH[<HOLE>]`: The vector length of the type represented by `<HOLE>`.
* `~DEPTH[<HOLE>]`: The tree depth of the type represented by `<HOLE>`.
  The content of `<HOLE>` must either be: `~TYP[N]`, `~TYPO`, or `~TYPEL[<HOLE>]`.
* `~SIZE[<HOLE>]`: The number of bits needed to encode the type represented by `<HOLE>`.
  The content of `<HOLE>` must either be: `~TYP[N]`, `~TYPO`, or `~TYPEL[<HOLE>]`.
* `~IF <CONDITION> ~THEN <THEN> ~ELSE <ELSE> ~FI`: renders the `<ELSE>` part when `<CONDITION>` evaluates to _0_, and renders the `<THEN>` in all other cases.
  Valid `<CONDITION>`s are `~LENGTH[<HOLE>]`, `~SIZE[<HOLE>]`, `~CMPLE[<HOLE1>][<HOLE2>]`, `~DEPTH[<HOLE>]`, `~VIVADO`, `~IW64`, `~ISLIT[N]`, `~ISVAR[N]`, `~ISACTIVEENABLE[N]`, `~ISSYNC[N]`, and `~AND[<HOLE1>,<HOLE2>,..]`.
* `~VIVADO`: _1_ when Clash compiler is invoked with the `-fclash-hdlsyn Vivado` (or `Xilinx` or `ISE`) flag.
  To be used with in an `~IF .. ~THEN .. ~ELSE .. ~FI` statement.
* `~CMPLE[<HOLE1>][<HOLE2>]`: _1_ when `<HOLE1> <= <HOLE2>`, otherwise _0_
* `~IW64`: _1_ when `Int`/`Word`/`Integer` types are represented with 64 bits in HDL.
  _0_ when they're represented by 32 bits.
* `~TOBV[<HOLE>][<TYPE>]`: create conversion code that so that the expression in `<HOLE>` is converted to a bit vector (`std_logic_vector`).
  The `<TYPE>` hole indicates the type of the expression and must be either `~TYP[N]`, `~TYPO`, or `~TYPEL[<HOLE>]`.
* `~FROMBV[<HOLE>][<TYPE>]`: create conversion code that so that the expression in `<HOLE>`, which has a bit vector (`std_logic_vector`) type, is converted to type indicated by `<TYPE>`.
  The `<TYPE>` hole must be either `~TYP[N]`, `~TYPO`, or `~TYPEL[<HOLE>]`.
* `~INCLUDENAME[N]`: the generated name of the `N`'th included component.
* `~FILE[<HOLE>]`: The argument mentioned in `<HOLE>` is a file which must be copied to the location of the generated HDL.
* `~GENERATE`: Verilog: create a _generate_ statement, except when already in a _generate_ context.
* `~ENDGENERATE`: Verilog: create an _endgenerate_ statement, except when already in a _generate_ context.
* `~ISLIT[N]`: Is the `(N+1)`'th argument to the function a literal.
* `~ISVAR[N]`: Is the `(N+1)`'th argument to the function explicitly not a literal.
* `~ISSCALAR[N]`: Is the `(N+1)`'th argument to the function a scalar.
  Note that this means different things for different HDLs.
  In (System)Verilog only `Bit` and `Bool` are considered scalar.
  In VHDL, in addition to those two, enumeration types and integers are considered scalar.
* `~TAG[N]`: Name of given domain.
  Errors when called on an argument which is not a `KnownDomain`, `Reset`, or `Clock`.
* `~PERIOD[N]`: Clock period of given domain.
  Errors when called on an argument which is not a `Clock`, `Reset`, `KnownDomain` or `KnownConf`.
* `~ISACTIVEENABLE[N]`: Is the `(N+1)`'th argument an Enable line __not__ set to a constant True.
* `~ISSYNC[N]`: Does synthesis domain at the `(N+1)`'th argument have synchronous resets.
  Errors when called on an argument which is not a `Reset`, `Clock`, `Enable`, `KnownDomain` or `KnownConf`.
* `~ISINITDEFINED[N]`: Does synthesis domain at the `(N+1)`'th argument have defined initial values.
  Errors when called on an argument which is not a `Clock`, `Reset`, `Enable`, `KnownDomain` or `KnownConf`.
* `~ACTIVEEDGE[edge][N]`: Does synthesis domain at the `(N+1)`'th argument respond to _edge_.
  _edge_ must be one of `Falling` or `Rising`.
  Errors when called on an argument which is not a `Clock`, `Reset`, `Enable`, `KnownDomain` or `KnownConf`.
* `~AND[<HOLE1>,<HOLE2>,..]`: Logically _and_ the conditions in the `<HOLE>`'s
* `~VAR[<NAME>][N]`: Like `~ARG[N]` but binds the argument to a variable named NAME.
  The `<NAME>` can be left blank, then Clash will come up with a (unique) name.
* `~VARS[N]`: VHDL: Return the variables at the `(N+1)`'th argument.
* `~NAME[N]`: Render the `(N+1)`'th string literal argument as an identifier instead of a string literal.
  Fails when the `(N+1)`'th argument is not a string literal.
* `~DEVNULL[<HOLE>]`: Render all dependencies of `<HOLE>`, but disregard direct output.
* `~REPEAT[<HOLE>][N]`: Repeat literal value of `<HOLE>` a total of `N` times.
* `~TEMPLATE[<HOLE1>][<HOLE2>]`: Render a file `<HOLE1>` with contents `<HOLE2>`.

Some final remarks to end this section: HDL primitives are there to instruct the Clash compiler to use the given HDL template, instead of trying to do normal synthesis.
As a consequence you can use constructs inside the Haskell definitions that are normally not synthesizable by the Clash compiler.
However, VHDL primitives do not give us _co-simulation_, where you would be able to simulate VHDL and Haskell in a _single_ environment.
If you still want to simulate your design in Haskell, you will have to describe, in a cycle- and bit-accurate way, the behavior of that (potentially complex) IP you are trying to include in your design.

## Verilog examples

For those who are interested, the equivalent Verilog primitives are:

``` yaml
BlackBox:
  name: Clash.Sized.Internal.Signed.*#
  kind: Expression
  type: '(*#) :: KnownNat n => Signed n -> Signed n -> Signed n'
  template: ~ARG[1] * ~ARG[2]
```

and

``` yaml
BlackBox:
  name: Clash.Explicit.BlockRam.blockRam#
  kind: Declaration
  outputUsage: NonBlocking
  type: |-
    blockRam#
      :: ( KnownDomain dom        ARG[0]
         , HasCallStack  --       ARG[1]
         , NFDataX a )   --       ARG[2]
      => Clock dom       -- clk,  ARG[3]
      => Enable dom      -- en,   ARG[4]
      -> Vec n a         -- init, ARG[5]
      -> Signal dom Int  -- rd,   ARG[6]
      -> Signal dom Bool -- wren, ARG[7]
      -> Signal dom Int  -- wr,   ARG[8]
      -> Signal dom a    -- din,  ARG[9]
      -> Signal dom a
  template: |-
    // blockRam begin
    reg ~TYPO ~GENSYM[~RESULT_RAM][1] [0:~LENGTH[~TYP[5]]-1];
    reg ~TYP[5] ~GENSYM[ram_init][3];
    integer ~GENSYM[i][4];
    initial begin
      ~SYM[3] = ~CONST[5];
      for (~SYM[4]=0; ~SYM[4] < ~LENGTH[~TYP[5]]; ~SYM[4] = ~SYM[4] + 1) begin
        ~SYM[1][~LENGTH[~TYP[5]]-1-~SYM[4]] = ~SYM[3][~SYM[4]*~SIZE[~TYPO]+:~SIZE[~TYPO]];
      end
    end
    ~IF ~ISACTIVEENABLE[4] ~THEN
    always @(~IF~ACTIVEEDGE[Rising][0]~THENposedge~ELSEnegedge~FI ~ARG[3]) begin : ~GENSYM[~RESULT_blockRam][5]~IF ~VIVADO ~THEN
      if (~ARG[4]) begin
        if (~ARG[7]) begin
          ~SYM[1][~ARG[8]] <= ~ARG[9];
        end
        ~RESULT <= ~SYM[1][~ARG[6]];
      end~ELSE
      if (~ARG[7] & ~ARG[4]) begin
        ~SYM[1][~ARG[8]] <= ~ARG[9];
      end
      if (~ARG[4]) begin
        ~RESULT <= ~SYM[1][~ARG[6]];
      end~FI
    end~ELSE
    always @(~IF~ACTIVEEDGE[Rising][0]~THENposedge~ELSEnegedge~FI ~ARG[3]) begin : ~SYM[5]
      if (~ARG[7]) begin
        ~SYM[1][~ARG[8]] <= ~ARG[9];
      end
      ~RESULT <= ~SYM[1][~ARG[6]];
    end~FI
    // blockRam end
```

## SystemVerilog examples
And the equivalent SystemVerilog primitives are:

``` yaml
BlackBox:
  name: Clash.Sized.Internal.Signed.*#
  kind: Expression
  type: '(*#) :: KnownNat n => Signed n -> Signed n -> Signed n'
  template: ~ARG[1] * ~ARG[2]
```

and

``` yaml
BlackBox:
  name: Clash.Explicit.BlockRam.blockRam#
  kind: Declaration
  type: |-
    blockRam#
      :: ( KnownDomain dom        ARG[0]
         , HasCallStack  --       ARG[1]
         , NFDataX a )   --       ARG[2]
      => Clock dom       -- clk,  ARG[3]
      -> Enable dom      -- en,   ARG[4]
      -> Vec n a         -- init, ARG[5]
      -> Signal dom Int  -- rd,   ARG[6]
      -> Signal dom Bool -- wren, ARG[7]
      -> Signal dom Int  -- wr,   ARG[8]
      -> Signal dom a    -- din,  ARG[9]
      -> Signal dom a
  template: |-
    // blockRam begin
    ~SIGD[~GENSYM[RAM][1]][5];
    logic [~SIZE[~TYP[9]]-1:0] ~GENSYM[~RESULT_q][2];
    initial begin
      ~SYM[1] = ~CONST[5];
    end~IF ~ISACTIVEENABLE[4] ~THEN
    always @(~IF~ACTIVEEDGE[Rising][0]~THENposedge~ELSEnegedge~FI ~ARG[3]) begin : ~GENSYM[~COMPNAME_blockRam][3]~IF ~VIVADO ~THEN
      if (~ARG[4]) begin
        if (~ARG[7]) begin
          ~SYM[1][~ARG[8]] <= ~TOBV[~ARG[9]][~TYP[9]];
        end
        ~SYM[2] <= ~SYM[1][~ARG[6]];
      end~ELSE
      if (~ARG[7] & ~ARG[4]) begin
        ~SYM[1][~ARG[8]] <= ~TOBV[~ARG[9]][~TYP[9]];
      end
      if (~ARG[4]) begin
        ~SYM[2] <= ~SYM[1][~ARG[6]];
      end~FI
    end~ELSE
    always @(~IF~ACTIVEEDGE[Rising][0]~THENposedge~ELSEnegedge~FI ~ARG[3]) begin : ~SYM[3]
      if (~ARG[7]) begin
        ~SYM[1][~ARG[8]] <= ~TOBV[~ARG[9]][~TYP[9]];
      end
      ~SYM[2] <= ~SYM[1][~ARG[6]];
    end~FI
    assign ~RESULT = ~FROMBV[~SYM[2]][~TYP[9]];
    // blockRam end
```
