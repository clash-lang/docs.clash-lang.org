# Synthesize annotations: controlling VHDL/(System)Verilog generation.

`Synthesize` annotations allow us to control hierarchy and naming aspects of the Clash compiler, specifically, they allow us to:

  * Assign names to entities (VHDL) / modules ((System)Verilog), and their ports.
  * Put generated HDL files of a logical (sub)entity in their own directory.
  * Use cached versions of generated HDL, i.e., prevent recompilation of (sub)entities that have not changed since the last run.
    Caching is based on a `.manifest` which is generated alongside the HDL; deleting this file means deleting the cache; changing this file will result in *undefined* behavior.

Functions with a `Synthesize` annotation must adhere to the following restrictions:

  * Although functions with a `Synthesize` annotation can of course depend on functions with another `Synthesize` annotation, they must not be mutually recursive.
  * Functions with a `Synthesize` annotation must be completely *monomorphic* and *first-order*, and cannot have any *non-representable* arguments or result.

Also take the following into account when using `Synthesize` annotations.

  * The Clash compiler is based on the GHC Haskell compiler, and the GHC machinery does not understand `Synthesize` annotations and it might subsequently decide to inline those functions.
    You should therefor also add a `{-# OPAQUE f #-}` pragma to the functions which you give a `Synthesize` functions.
  * Functions with a `Synthesize` annotation will not be specialized on constants.

Finally, the root module, the module which you pass as an argument to the Clash compiler must either have:

  * A function with a `Synthesize` annotation.
  * A function called *topEntity*.

You apply `Synthesize` annotations to functions using an `ANN` pragma:

``` haskell
{-# OPAQUE topEntity #-}
{-# ANN topEntity (Synthesize {t_name = ..., ...  }) #-}
topEntity x = ...
```

For example, given the following specification:

``` haskell
module Blinker where

import Clash.Signal
import Clash.Prelude
import Clash.Intel.ClockGen

createDomain vSystem{vName="DomInput", vPeriod=20000, vResetPolarity=ActiveLow}
createDomain vSystem{vName="Dom100", vPeriod=10000}

topEntity
  :: Clock DomInput
  -> Reset DomInput
  -> Signal Dom100 Bit
  -> Signal Dom100 (BitVector 8)
topEntity clk rst =
  exposeClockResetEnable (mealy blinkerT (1,False,0) . isRising 1) pllOut pllRst enableGen
 where
  (pllOut,pllRst) = altpllSync clk rst

blinkerT (leds,mode,cntr) key1R = ((ledsN,modeN,cntrN),leds)
 where
  -- clock frequency = 100e6  (100 MHz)
  -- led update rate = 333e-3 (every 333ms)
  cnt_max = maxBound :: Index 33300000 -- 100e6 * 333e-3

  cntrN | cntr == cnt_max = 0
        | otherwise       = cntr + 1

  modeN | key1R     = not mode
        | otherwise = mode

  ledsN | cntr == 0 = if mode then complement leds
                              else rotateL leds 1
        | otherwise = leds
```

The Clash compiler will normally generate the following `topentity.vhdl` file:

``` vhdl
-- Automatically generated VHDL-93
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;
use IEEE.MATH_REAL.ALL;
use std.textio.all;
use work.all;
use work.Blinker_topEntity_types.all;

entity topEntity is
  port(-- clock
       clk    : in Blinker_topEntity_types.clk_DomInput;
       -- reset
       rst    : in Blinker_topEntity_types.rst_DomInput;
       eta    : in std_logic;
       result : out std_logic_vector(7 downto 0));
end;

architecture structural of topEntity is
 ...
end;
```

However, if we add the following `Synthesize` annotation in the file:

``` haskell
{-# OPAQUE topEntity #-}
{-# ANN topEntity
  (Synthesize
    { t_name   = "blinker"
    , t_inputs = [PortName "CLOCK_50", PortName "KEY0", PortName "KEY1"]
    , t_output = PortName "LED"
    }) #-}
```

The Clash compiler will generate the following `blinker.vhdl` file instead:

``` vhdl
-- Automatically generated VHDL-93
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;
use IEEE.MATH_REAL.ALL;
use std.textio.all;
use work.all;
use work.blinker_types.all;

entity blinker is
  port(-- clock
       CLOCK_50 : in blinker_types.clk_DomInput;
       -- reset
       KEY0     : in blinker_types.rst_DomInput;
       KEY1     : in std_logic;
       LED      : out std_logic_vector(7 downto 0));
end;

architecture structural of blinker is
 ...
end;
```

Where we now have:

* A top-level component that is called `blinker`.
* Inputs and outputs that have a *user*-chosen name: `CLOCK_50`, `KEY0`, `KEY1`, `LED`, etc.

See the documentation of `Synthesize` for the meaning of all its fields.
