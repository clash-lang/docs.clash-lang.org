# Introduction

Clash is a functional hardware description language that borrows both its syntax and semantics from the functional programming language Haskell.
It provides a familiar structural design approach to both combination and synchronous sequential circuits.
The Clash compiler transforms these high-level descriptions to low-level synthesizable VHDL, Verilog, or SystemVerilog.

Features of Clash:

  * Strongly typed, but with a very high degree of type inference, enabling both safe and fast prototyping using concise descriptions.
  * Interactive REPL: load your designs in an interpreter and easily test all your component without needing to setup a test bench.
  * Compile your designs for fast simulation.
  * Higher-order functions, in combination with type inference, result in designs that are fully parametric by default.
  * Synchronous sequential circuit design based on streams of values, called `Signal`s, lead to natural descriptions of feedback loops.
  * Multiple clock domains, with type safe clock domain crossing.
  * Template language for introducing new VHDL/(System)Verilog primitives.

Although we say that Clash borrows the semantics of Haskell, that statement should be taken with a grain of salt.
What we mean to say is that the Clash compiler views a circuit description as *structural* description.
This means, in an academic handwavy way, that every function denotes a component and every function application denotes an instantiation of said component.
Now, this has consequences on how we view *recursively* defined functions: structurally, a recursively defined function would denote an *infinitely* deep / structured component, something that cannot be turned into an actual circuit (See also [Limitations of Clash](#limitations)).

On the other hand, Haskell's by-default non-strict evaluation works very well for the simulation of the feedback loops, which are ubiquitous in digital circuits.
That is, when we take our structural view to circuit descriptions, value-recursion corresponds directly to a feedback loop:

``` haskell
counter = s
  where
    s = register 0 (s + 1)
```

The above definition, which uses value-recursion, *can* be synthesized to a circuit by the Clash compiler.

Over time, you will get a better feeling for the consequences of taking a *structural* view on circuit descriptions.
What is always important to remember is that every applied functions results in an instantiated component, and also that the compiler will *never* infer / invent more logic than what is specified in the circuit description.

With that out of the way, let us continue with installing Clash and building our first circuit.
