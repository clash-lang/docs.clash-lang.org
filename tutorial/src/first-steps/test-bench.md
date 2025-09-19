# Circuit testbench

There are multiple reasons as to why you might want to create a so-called *test bench* for the generated HDL:

- You want to compare post-synthesis / post-place&route behavior to that of the behavior of the original generated HDL.
- Need representative stimuli for your dynamic power calculations.
- Verify that the HDL output of the Clash compiler has the same behavior as the Haskell / Clash specification.

For these purposes, you can have the Clash compiler generate a *test bench*.
In order for the Clash compiler to do this you need to do one of the following:

- Create a function called *testBench* in the root module.
- Annotate your *topEntity* function (or function with a [Synthesize](Clash-Tutorial.html#g:12) annotation) with a `TestBench` annotation.

For example, you can test the earlier defined *topEntity* by:

``` haskell
import Clash.Explicit.Testbench

topEntity ::
  Clock System ->
  Reset System ->
  Enable System ->
  Signal System (Signed 9, Signed 9) ->
  Signal System (Signed 9)
topEntity = exposeClockResetEnable mac

testBench :: Signal System Bool
testBench = done
 where
  testInput =
    stimuliGenerator
      clk
      rst
      $(listToVecTH [(1, 1) :: (Signed 9, Signed 9), (2, 2), (3, 3), (4, 4)])
  expectOutput =
    outputVerifier clk rst $(listToVecTH [0 :: Signed 9, 1, 5, 14, 14, 14, 14])
  done = expectOutput (topEntity clk rst en testInput)
  en = enableGen
  clk = tbSystemClockGen (not <$> done)
  rst = systemResetGen
```

This will create a stimulus generator that creates the same inputs as we used earlier for the simulation of the circuit, and creates an output verifier that compares against the results we got from our earlier simulation.
We can even simulate the behavior of the *testBench*:

``` haskell
>>> sampleN 8 testBench
[False,False,False,False,False
cycle(<Clock: System>): 5, outputVerifier
expected value: 14, not equal to actual value: 30
,False
cycle(<Clock: System>): 6, outputVerifier
expected value: 14, not equal to actual value: 46
,False
cycle(<Clock: System>): 7, outputVerifier
expected value: 14, not equal to actual value: 62
,False]
```

We can see that for the first 4 samples, everything is working as expected, after which warnings are being reported.
The reason is that `stimuliGenerator` will keep on producing the last sample, (4,4), while the `outputVerifier'` will keep on expecting the last sample, 14.
In the VHDL testbench these errors won't show, as the global clock will be stopped after 4 ticks.

You should now again run `:vhdl` in the interpreter; this time the compiler will take a bit longer to generate all the circuits.
Inside the `./vhdl/MAC` directory you will now also find a *testbench* subdirectory containing all the `vhdl` files for the *test bench*.

After compilation is finished you load all the files in your favourite VHDL simulation tool.
Once all files are loaded into the VHDL simulator, run the simulation on the `testbench` entity.
On questasim / modelsim: doing a `run -all` will finish once the output verifier will assert its output to `true`.
The generated testbench, modulo the clock signal generator(s), is completely synthesizable.
This means that if you want to test your circuit on an FPGA, you will only have to replace the clock signal generator(s) by actual clock sources, such as an onboard PLL.
