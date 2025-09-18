# Generating VHDL

We are now almost at the point that we can create actual hardware, in the form of a [VHDL](http://en.wikipedia.org/wiki/VHDL) netlist, from our sequential circuit specification.
The first thing we have to do is create a function called `topEntity` and ensure that it has a **monomorphic** type.
In our case that means that we have to give it an explicit type annotation.
It might not always be needed, you can always check the type with the `:t` command and see if the function is monomorphic:

``` haskell
topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (Signed 9, Signed 9) ->
  Signal System (Signed 9)
topEntity = exposeClockResetEnable mac
```

Which makes our circuit work on 9-bit signed integers.
Including the above definition, our complete `MAC.hs` should now have the following content:

``` haskell
module MAC where

import Clash.Prelude

ma acc (x, y) = acc + x * y

macT acc (x, y) = (acc', o)
 where
  acc' = ma acc (x, y)
  o = acc

mac xy = mealy macT 0 xy

topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (Signed 9, Signed 9) ->
  Signal System (Signed 9)
topEntity = exposeClockResetEnable mac
```

The `topEntity` function is the starting point for the Clash compiler to transform your circuit description into a VHDL netlist.
It must meet the following restrictions in order for the Clash compiler to work:

-   It must be completely monomorphic
-   It must be completely first-order
-   Although not strictly necessary, it is recommended to *expose* `Hidden` clock and reset arguments, as it makes user-controlled [name assignment](Clash-Tutorial.html#annotations) in the generated HDL easier to do.

Our `topEntity` meets those restrictions, and so we can convert it successfully to VHDL by executing the `:vhdl` command in the interpreter.
This will create a directory called `vhdl`, which contains a directory called `MAC`, which ultimately contains all the generated VHDL files.
You can now load these files into your favourite VHDL synthesis tool, marking `topentity.vhdl` as the file containing the top level entity.
