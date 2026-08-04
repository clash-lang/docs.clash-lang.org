{
  description = "The Clash Book, with executable examples checked against supported Clash versions";

  inputs = {
    clash-1_8_5.url = "github:clash-lang/clash-compiler/v1.8.5";
    clash-1_10.url = "github:clash-lang/clash-compiler/v1.10.0";
    clash-master.url = "github:clash-lang/clash-compiler/master";

    nixpkgs.follows = "clash-1_10/nixpkgs";

    mdbook-clash-1_8_5.url = "github:clash-lang/mdbook-clash";
    mdbook-clash-1_8_5.inputs.clash-compiler.follows = "clash-1_8_5";

    mdbook-clash-1_10.url = "github:clash-lang/mdbook-clash";
    mdbook-clash-1_10.inputs.clash-compiler.follows = "clash-1_10";

    mdbook-clash-master.url = "github:clash-lang/mdbook-clash";
    mdbook-clash-master.inputs.clash-compiler.follows = "clash-master";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      ...
    }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor = system: import nixpkgs { inherit system; };

      mdbookClashFor = version: system: inputs."mdbook-clash-${version}".packages.${system}.mdbook-clash;

      buildBook =
        pkgs: version:
        pkgs.runCommand "clash-book-${version}"
          {
            nativeBuildInputs = [
              pkgs.mdbook
              (mdbookClashFor version pkgs.stdenv.hostPlatform.system)
            ];
          }
          ''
            cp -r ${self} source
            chmod -R u+w source
            cd source

            mdbook build
            mdbook build tutorial
            mdbook build compiler-user-guide

            mkdir -p $out
            cp -r public/. $out/
            cp CNAME robots.txt $out/
          '';
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = pkgsFor system;
        in
        rec {
          book-clash-1_8_5 = buildBook pkgs "1_8_5";
          book-clash-1_10 = buildBook pkgs "1_10";
          book-clash-master = buildBook pkgs "master";
          default = book-clash-1_10;
          mdbook-clash = mdbookClashFor "1_10" system;
        }
      );

      checks = forAllSystems (system: {
        inherit (self.packages.${system})
          book-clash-1_8_5
          book-clash-1_10
          book-clash-master
          ;
      });

      devShells = forAllSystems (
        system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.mdbook
              self.packages.${system}.mdbook-clash
            ];

            shellHook = ''
              echo "Clash Book development shell (Clash 1.10)"
              echo "Build locally: mdbook build && mdbook build tutorial && mdbook build compiler-user-guide"
              echo "Check all supported Clash versions: nix flake check"
            '';
          };
        }
      );
    };
}
