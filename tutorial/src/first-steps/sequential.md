# Sequential circuit

The `register` function is our primary sequential building block to capture *state*.
It is used internally by one of the `Clash.Prelude` function that we will use to describe our MAC circuit.
Note that the following paragraphs will only show one of many ways to specify a sequential circuit, in the section [Alternative specifications](#mac6) we will show a couple more.

A principled way to describe a sequential circuit is to use one of the classic machine models, within the Clash prelude library offer standard function to support the [Mealy machine](http://en.wikipedia.org/wiki/Mealy_machine).
To improve sharing, we will combine the transition function and output function into one.
This gives rise to the following Mealy specification of the MAC circuit:

``` haskell
macT acc (x, y) = (acc', o)
  where
    acc' = ma acc (x, y)
    o    = acc
```

Note that the `where` clause and explicit tuple are just for demonstrative purposes, without loss of sharing we could've also written:

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

The `Clash.Prelude` library contains a function that creates a sequential circuit from a combinational circuit that has the same Mealy machine type / shape of `macT`:

``` haskell
mealy
  :: (HiddenClockResetEnable dom, NFDataX s)
  => (s -> i -> (s,o))
  -> s
  -> (Signal dom i -> Signal dom o)
mealy f initS = ...
```

The complete sequential MAC circuit can now be specified as:

``` haskell
mac inp = mealy macT 0 inp
```

Where the first argument of `mealy` is our `macT` function, and the second argument is the initial state, in this case 0.
We can see it is functioning correctly in our interpreter:

``` haskell
>>> import qualified Data.List as L
>>> L.take 4 $ simulate @System mac [(1,1),(2,2),(3,3),(4,4)]
[0,1,5,14]
```

Where we simulate our sequential circuit over a list of input samples and take the first 4 output samples.
We have now completed our first sequential circuit and have made an initial confirmation that it is working as expected.
