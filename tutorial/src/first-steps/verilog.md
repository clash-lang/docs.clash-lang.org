# Generating Verilog and SystemVerilog

Aside from being able to generate VHDL, the Clash compiler can also generate Verilog and SystemVerilog.
You can repeat the previous two parts of the tutorial, but instead of executing the `:vhdl` command, you execute the `:verilog` or `:sytemverilog` command in the interpreter.
This will create a directory called `verilog`, respectively `systemverilog`, which contains a directory called `MAC`, which ultimately contains all the generated Verilog and SystemVerilog files.
Verilog files end in the file extension `v`, while SystemVerilog files end in the file extension `sv`.

This concludes the tutorial for "Your first circuit".
