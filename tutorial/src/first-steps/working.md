# Working with this tutorial

This tutorial can be followed best whilst having the Clash interpreter running at the same time.
If you followed the [instructions](https://clash-lang.org/install/) to setup a starter project with Stack, you can also run `clashi` inside such a project.
Change to the directory of the project, and invoke

```
> stack run -- clashi
```

If you instead set up the starter project with GHC and Cabal, change to the directory of the project and invoke

```
> cabal run -- clashi
```

If you instead followed the instructions under *Run Clash on its own*, you can start the Clash compiler in interpretive mode by:

```
stack exec --resolver lts-23.15 --package clash-ghc -- clashi
```

For those familiar with Haskell/GHC, this is indeed just `GHCi`, with three added commands (`:vhdl`, `:verilog`, and `:systemverilog`).
You can load files into the interpreter using the `:l <FILENAME>` command.
Now, depending on your choice in editor, the following `edit-load-run` cycle probably work best for you:

- **Commandline (e.g. emacs, vim):**

    - You can run system commands using `:!`, for example `:! touch <FILENAME>`
    - Set the /editor/ mode to your favourite editor using: `:set editor <EDITOR>`
    - You can load files using `:l` as noted above.
    - You can go into /editor/ mode using: `:e`
    - Leave the editor mode by quitting the editor (e.g. `:wq` in `vim`)

- **GUI (e.g. SublimeText, Notepad++):**

    - Just create new files in your editor.
    - Load the files using `:l` as noted above.
    - Once a file has been edited and saved, type `:r` to reload the files in the interpreter

You are of course free to deviate from these suggestions as you see fit :-).
It is just recommended that you have the Clash interpreter open during this tutorial.
