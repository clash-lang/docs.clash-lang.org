# Generating Verilog and SystemVerilog

Aside from being able to generate VHDL, the Clash compiler can also generate Verilog and SystemVerilog.
You can repeat the previous two parts of the tutorial, but instead of executing the `:vhdl` command, you execute the `:verilog` or `:sytemverilog` command in the interpreter.
This will create a directory called `verilog`, respectively `systemverilog`, which contains a directory called `MAC`, which ultimately contains all the generated Verilog and SystemVerilog files.
Verilog files end in the file extension `v`, while SystemVerilog files end in the file extension `sv`.

This concludes the main part of this section on "Your first circuit", read on for alternative specifications for the same `mac` circuit, or just skip to the next section where we will describe another DSP classic: an FIR filter structure.
