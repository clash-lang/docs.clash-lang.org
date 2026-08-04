# Introduction

Clash is a functional hardware description language that borrows both its syntax and semantics from the functional programming language Haskell.
It provides a familiar structural design approach to both combinational and synchronous sequential circuits.

Features of the Clash language:

  * Strongly typed, but with a very high degree of type inference, enabling both safe and fast prototyping using concise descriptions.
  * Interactive [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop): load your designs in an interpreter and easily test all your components without needing to set up a test bench.
  * Higher-order functions, in combination with type inference, result in designs that are fully parametric by default.
  * Synchronous sequential circuit design based on streams of values, called `Signal`s, leads to natural descriptions of feedback loops.
  * Multiple clock domains, with type-safe clock domain crossing.

Although we say that Clash borrows the semantics of Haskell, that statement should be taken with a grain of salt.
What we mean to say is that the Clash compiler views a circuit description as a *structural* description.
This means, in an academically handwavy way, that every function denotes a component and every function application denotes an instantiation of said component.
Now, this has consequences on how we view *recursively* defined functions: structurally, a recursively defined function would denote an *infinitely* deeply structured component, something that cannot be turned into an actual circuit.

On the other hand, Haskell's by-default non-strict evaluation works very well for the simulation of feedback loops, which are ubiquitous in digital circuits.
That is, when we take a structural view on circuit descriptions, value recursion corresponds directly to a feedback loop:

``` haskell
counter = s
 where
  s = register 0 (s + 1)
```

The above definition, which uses value recursion, *can* be synthesized to a circuit by the Clash compiler.

Over time, you will get a better feeling for the consequences of taking a *structural* view on circuit descriptions.
What is always important to remember is that every applied function results in an instantiated component, and also that the compiler will *never* infer/invent more logic than what is specified in the circuit description.

With that out of the way, let us continue with installing Clash and building our first circuit.

## Installing Clash

For installation instructions, see [clash-lang.org/install/](https://clash-lang.org/install/)
