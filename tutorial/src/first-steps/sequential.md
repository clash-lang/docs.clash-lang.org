# Sequential circuit

The `register` function is our primary sequential building block to capture *state*.
It is used internally by one of the `Clash.Prelude` functions that we will use to describe our MAC circuit.

A principled way to describe a sequential circuit is to use one of the classic machine models.
Within the Clash prelude library we offer a standard function to support the [Mealy machine](http://en.wikipedia.org/wiki/Mealy_machine).
To improve sharing, we will combine the transition function and output function into one.
This gives rise to the following Mealy specification of the MAC circuit:

``` haskell
macT acc (x, y) = (acc', o)
 where
  acc' = ma acc (x, y)
  o = acc
```

Note that the `where` clause and explicit tuple are just for demonstrative purposes, without loss of sharing we could have also written:

``` haskell
macT acc inp = (ma acc inp, acc)
```

Going back to the original specification we note the following:

- `acc` is the current *state* of the circuit.
- `(x, y)` is its input.
- `acc'` is the updated, or next, *state*.
- `o` is the output.

When we examine the type of `macT` we see that is still completely combinational:

``` haskell
>>> :t macT
macT :: Num a => a -> (a, a) -> (a, a)
```

The `Clash.Prelude` library contains a function that creates a sequential circuit from a combinational circuit that has the same Mealy machine type/shape of `macT`:

``` haskell
mealy ::
  (HiddenClockResetEnable dom, NFDataX s) =>
  (s -> i -> (s, o)) ->
  s ->
  (Signal dom i -> Signal dom o)
mealy f initS = ...
```

The complete sequential MAC circuit can now be specified as:

``` haskell
mac inp = mealy macT 0 inp
```

Where the first argument of `mealy` is our `macT` function, and the second argument is the initial state, in this case 0.
We can see it is functioning correctly in our interpreter:
    <!--
    We do something very interesting here.
    In the previous chapter (tutorial/src/first-steps/first-circuit.md), we introduced `sampleN` and explained the significance of the first two samples.
    Now we use `simulateN`, which drops the initial value and only shows the reset cycle, and brazenly we say "we can see it is functioning correctly".
    So first we explain the first two samples will often be the initial value (due to the reset value being equal to the initial value), and then without any explanation we say that it is correct that suddenly we see only one initial value.
    We need to take away the confusion.
    This can be done in several ways and should be discussed.
    -->

``` haskell
>>> simulateN @System 4 mac [(1,1),(2,2),(3,3),(4,4)]
[0,1,5,14]
```

Where we simulate our sequential circuit over a list of input samples and take the first 4 output samples.
We have now completed our first sequential circuit and have made an initial confirmation that it is working as expected.
