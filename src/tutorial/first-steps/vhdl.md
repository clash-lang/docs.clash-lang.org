# Generate VHDL

Our MAC circuit can now be simulated, but Clash still needs to know the exact
hardware interface before it can generate VHDL. We describe that interface with
a monomorphic `topEntity`.

Update `MAC.hs` to contain the complete circuit:

```haskell,clash group=mac-vhdl topEntity=topEntity
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

The type of `topEntity` fixes the choices that were still polymorphic in
`mac`:

- The circuit uses the `System` clock domain.
- Both input values and the output are 9-bit signed integers.
- Clock, reset, and enable are explicit ports of the generated circuit.

`mac` uses an implicit clock, reset, and enable through the
`HiddenClockResetEnable` constraint required by `mealy`.
`exposeClockResetEnable` turns those hidden arguments into the explicit ports
shown in the type of `topEntity`.

## The hardware boundary

Clash starts HDL generation at `topEntity`. A top entity must have a type that
can describe a finite hardware interface. In practice, it must be:

- monomorphic, with no unresolved type variables;
- first-order, with no functions as inputs or outputs;
- built from types that Clash can represent in hardware.

The explicit type signature makes these choices visible to both Clash and the
reader. It also prevents a later change elsewhere in the module from silently
changing the generated ports.

## Generate the files

Start the Clash interpreter with the module:

```console
clash --interactive MAC.hs
```

At the interpreter prompt, generate VHDL:

```console
clash> :vhdl
```

You can also generate it without entering the interpreter:

```console
clash --vhdl MAC.hs
```

Clash writes the result below `vhdl/MAC.topEntity/`. The generated
`topEntity.vhdl` file contains the top-level VHDL entity. Add all generated VHDL
files from that directory to your synthesis project and select `topEntity` as
the design's top level.

The next chapter adds a test bench so the generated HDL can be exercised in a
VHDL simulator.
