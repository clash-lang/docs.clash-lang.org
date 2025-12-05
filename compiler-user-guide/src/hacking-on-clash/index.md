# Hacking on the Clash Compiler

## Prerequisites

Hacking on Clash requires more dependencies than simply running Clash.
The test suite requires having a tool available to synthesize any backend being tested.
This means you need:

- [ghdl](https://github.com/ghdl/ghdl) installed to test *VHDL*
- [iverilog](https://github.com/steveicarus/iverilog) installed to test *Verilog*
- [Verilator](http://verilator.org/) installed to test *Verilog* and *SystemVerilog*
- [ModelSim](https://fpgasoftware.intel.com/?product=modelsim_ae#tabs-2) installed to test *SystemVerilog*
- [Vivado](https://www.amd.com/en/products/software/adaptive-socs-and-fpgas/vivado.html) installed to test *VHDL*, *Verilog* and *SystemVerilog*
- [SymbiYosys](https://github.com/YosysHQ/SymbiYosys) and [Z3](https://github.com/Z3Prover/z3) installed to test *Verilog* and *SystemVerilog*

## Get Clash from source

Get the source code using [Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F) and enter the cloned directory:

``` bash
git clone git@github.com:clash-lang/clash-compiler.git

# Alternatively, if you haven't setup SSH keys with GitHub:
# git clone https://github.com/clash-lang/clash-compiler.git

cd clash-compiler
```

To check out a released version, use:

``` bash
git checkout v1.2.3
```

To checkout a release *branch* use:

``` bash
git checkout 1.2
```

Note that release branches might contain non-released patches.

### Cabal

To use Cabal you need both Cabal and GHC installed on your system.
For Linux and MacOS users we recommend using [ghcup](https://www.haskell.org/ghcup/).
Windows users are recommended to use the [Haskell Platform](https://www.haskell.org/platform/windows.html).

To run <span class="title-ref">clash</span> use:

``` bash
cabal v2-run -- clash
```

If this fails, make sure you've got an up-to-date package index:

``` bash
cabal update
```

### Stack

[Install Stack](https://docs.haskellstack.org/en/stable/install_and_upgrade/) and run:

``` bash
stack run -- clash
```

### Nix

Or [use Nix](https://nixos.org/nix/download.html) to get a shell with the `clash` and `clashi` binaries on your PATH:

``` bash
nix develop
```
## Subprojects

The Clash compiler consists of different cabal libraries, which together provide a complete compiler.
Primarily, this consists of

`clash-ghc`
    <!--
    We should note here as well that `clash-ghc` is an internal package and offers no API stability.
    -->

> The frontend of the compiler, using parts of the GHC frontend.
> This provides the ability to load modules, translate GHC Core to Clash Core, and implements the `clash` and `clashi` executables.
>
> A lot of the code in this library is separated by the version of GHC it works with.
> For example, `src-bin-9.0` is specific to GHC 9.0.x.

`clash-lib`
    <!--
    We should note here as well that `clash-lib` is an internal package and offers no API stability.
    -->

> The backend of the compiler, exposed as a library.
> This is the largest library in the project, and includes the various ASTs (e.g. Core, Netlist), normalization, code generation, and primitives / black boxes.

`clash-prelude`

> The standard library for Clash as a language.
> This includes anything that is used to develop hardware in Clash, such as Signals, Clocks and combinators for common forms of state machine.
>
> The `clash-prelude` library also re-exports parts of the Haskell `base` library, allowing circuit designs to reuse common functions and definitions.

The repository also contains other libraries.
These either provide additional functionality which is not required, or are not yet production-ready.
These are

`clash-cosim`

> Co-simulation for Clash, allowing Verilog to be run inline as though it were a normal Haskell function.
> This provides a QuasiQuoter for use in Haskell.
>
> <div class="warning">
>
> <div class="title">
>
> Warning
>
> </div>
>
> This library is very experimental, and is not guaranteed to work with the most recent development version of Clash.
>
> </div>

`clash-term`

> A development tool for analyzing how the normalizer in `clash-lib` affects the core of a particular design.
> It allows the result of each different optimizer pass to be seen for debugging purposes.

`clash-lib-hedgehog`

> Hedgehog Generators for `clash-lib`.

`clash-prelude-hedgehog`

> Hedgehog Generators for `clash-prelude`.
