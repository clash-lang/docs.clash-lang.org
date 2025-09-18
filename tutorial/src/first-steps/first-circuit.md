# Your first circuit

The very first circuit that we will build is the "classic" multiply-and-accumulate (MAC) circuit.
This circuit is as simple as it sounds, it multiplies its inputs and accumulates them.
Before we describe any logic, we must first create the file we will be working on and input some preliminaries:

* Create the file:

    ```
    MAC.hs
    ```

* Write on the first line the module header:

    ``` haskell
    module MAC where
    ```

    Module names must always start with a **C**apital letter.
    Also make sure that the file name corresponds to the module name.

* Add the import statement for the Clash prelude library:

    ``` haskell
    import Clash.Prelude
    ```

    This imports all the necessary functions and datatypes for circuit description.

We can now finally start describing the logic of our circuit, starting with just the multiplication and addition:

``` haskell
ma acc (x, y) = acc + x * y
```

The circuit we just wrote is a combinational circuit: no registers are inserted (you describe explicitly where Clash will insert registers, as we'll later see).
We usually refer to circuits as *functions*, similar to programming languages such as C, Python, or Haskell.
In this case, the function we just defined is called `ma`.
Its first argument is `acc`, its second is `(x, y)` - a composite type called a tuple.
This component is "unpacked", and its first element is called `x`, its second `y`.
Everything to the right of the equals symbol is `ma`'s result.
If you followed the instructions of running the interpreter side-by-side, you can already test this function:

``` haskell
>>> ma 4 (8, 9)
76
>>> ma 2 (3, 4)
14
```

We can also examine the inferred type of `ma` in the interpreter:

``` haskell
>>> :t ma
ma :: Num a => a -> (a, a) -> a
```

You should read this as follows:

 * **`ma ::`**, `ma` is of type..

* **`Num a`**, there is some type called `a` that is a `Num`.
    Examples of instances of `Num` are `Int`, `Signed 16`, `Index 32`, and `Float`.

 * **`a`**, `ma`'s first argument is of type `a`

 * **`(a, a)`**, `ma`'s second argument is of type `(a, a)`

 * **`a`**, `ma`'s result is of type `a`

Note that `ma` therefore works on multiple types!
The only condition we imposed is that `a` should be a `Num`ber type.
In Clash this means it should support the operations `Prelude.+`, `Prelude.-`, `Prelude.*`, and some others.
Indeed, this is why Clash adds the constraint in the first place: the definition of `ma` uses `+` and `*`.
Whenever a function works over multiple types, we call it *polymorphic* ("poly" meaning "many", "morphic" meaning "forms").
While powerful, its not clear how Clash should synthesize this as numbers come in a great variety in (bit)sizes.
We will later see how to use this function in a *monomorphic* manner.

Talking about *types* also brings us to one of the most important parts of this tutorial: *types* and *synchronous sequential logic*.
Especially how we can always determine, through the types of a specification, if it describes combinational logic or (synchronous) sequential logic.
We do this by examining the definition of one of the sequential primitives, the `register` function:

``` haskell
register ::
  ( HiddenClockResetEnable dom
  , NFDataX a
  ) =>
  a ->
  Signal dom a ->
  Signal dom a
register i s = ...
```

Where we see that the second argument and the result are not just of the *polymorphic* `a` type, but of the type: `Signal dom a`.
All (synchronous) sequential circuits work on values of type `Signal dom a`.
Combinational circuits always work on values of, well, not of type `Signal dom a`.
A `Signal` is an (infinite) list of samples, where the samples correspond to the values of the `Signal` at discrete, consecutive, ticks of the *clock*.
All (sequential) components in the circuit are synchronized to this global *clock*.
For the rest of this tutorial, and probably at any moment where you will be working with Clash, you should probably not actively think about `Signal`s as infinite lists of samples, but just as values that are manipulated by sequential circuits.
To make this even easier, it actually not possible to manipulate the underlying representation directly: you can only modify `Signal` values through a set of primitives such as the `register` function above.

Now, let us get back to the functionality of the `register` function: it is a simple [latch](https://en.wikipedia.org/wiki/Flip-flop_\(electronics\)) that only changes state at the tick of the global *clock*, and it has an initial value `a` which is its output at time 0.
We can further examine the `register` function by taking a look at the first 4 samples of the `register` functions applied to a constant signal with the value 8:

```haskell
>>> sampleN @System 4 (register 0 (pure (8 :: Signed 8)))
[0,0,8,8]
```

Where we see that the initial value of the signal is the specified 0 value, followed by 8's.
You might be surprised to see *two* zeros instead of just a single zero.
What happens is that in Clash you get to see the output of the circuit *before* the clock becomes active.
In other words, in Clash you get to describe the powerup values of registers too.
Whether this is a defined or unknown value depends on your hardware target, and can be configured by using a different synthesis `Domain`.
The default synthesis domain, `@System`, assumes that registers do have a powerup value - as is true for most FPGA platforms in most contexts.
