/* eslint-disable @typescript-eslint/no-explicit-any */

import { DNSConnect } from "@webinterop/dns-connect";
import { ENSModule } from "@webinterop/dns-connect-ens";
import { http } from "viem";
import { mainnet } from "viem/chains";
import { DomaModule } from "./DomaModule";

export const dnsConnect = new DNSConnect({
  modules: [
    new DomaModule(),
    new ENSModule({
      chain: mainnet as any,
      transport: http() as any,
    }),
  ],
});
