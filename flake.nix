{
  description = "Currency development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          fontsConf = pkgs.writeText "currency-fonts.conf" ''
            <?xml version="1.0"?>
            <!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
            <fontconfig>
              <dir>${pkgs.dejavu_fonts.minimal}/share/fonts/truetype</dir>
              <cachedir prefix="xdg">fontconfig</cachedir>
            </fontconfig>
          '';
          playwright =
            (pkgs.callPackage "${nixpkgs}/pkgs/development/web/playwright/driver.nix" {
              makeFontsConf = _: fontsConf;
            }).playwright-core;
          browsers =
            assert pkgs.lib.assertMsg
              (playwright.version == (builtins.fromJSON (builtins.readFile ./package.json)).devDependencies.playwright)
              "The Nix browsers and package.json must use the same Playwright version.";
            playwright.selectBrowsers {
              withFirefox = false;
              withWebkit = false;
              withFfmpeg = false;
            };
        in
        {
          default = pkgs.mkShellNoCC {
            packages = [
              pkgs.git
              pkgs.just
              pkgs.nodejs_24
              pkgs.pnpm
            ];
            PLAYWRIGHT_BROWSERS_PATH = "${browsers}";
            FONTCONFIG_FILE = "${fontsConf}";
            LANG = if pkgs.stdenv.isLinux then "C.UTF-8" else "en_US.UTF-8";
          };
        }
      );
    };
}
