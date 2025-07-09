# Installing Clash

Check out [clash-lang.org/install](https://clash-lang.org/install) to
install the latest stable release of Clash, or to setup a Clash project.

## Get Clash from source

Get the source code using
[Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F) and
enter the cloned directory:

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

To use Cabal you need both Cabal and GHC installed on your system. For
Linux and MacOS users we recommend using
[ghcup](https://www.haskell.org/ghcup/). Windows users are recommended
to use the [Haskell
Platform](https://www.haskell.org/platform/windows.html).

To run <span class="title-ref">clash</span> use:

``` bash
cabal v2-run --write-ghc-environment-files=always -- clash
```

If this fails, make sure you've got an up-to-date package index:

``` bash
cabal update
```

### Stack

[Install
Stack](https://docs.haskellstack.org/en/stable/install_and_upgrade/) and
run:

``` bash
stack run -- clash
```

### Nix

Or [use Nix](https://nixos.org/nix/download.html) to get a shell with
the `clash` and `clashi` binaries on your PATH:

``` bash
nix-shell
```
