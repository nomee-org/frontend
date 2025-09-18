import {
  DNSConnectModule,
  ResolutionResult,
  ReverseResolutionResult,
} from "@webinterop/dns-connect";
import { dataService } from "../doma/dataservice";
import { parseCAIP10 } from "@/hooks/use-helper";

export class DomaModule implements DNSConnectModule {
  name = "DomaModule";

  async resolve(
    name: string,
    _: string
  ): Promise<ResolutionResult | undefined> {
    try {
      const data = await dataService.getName({ name });

      if (data?.claimedBy) {
        return {
          address: parseCAIP10(data.claimedBy).address,
          ttl: 30,
        };
      } else {
        return undefined;
      }
    } catch (error) {
      console.warn(error);
      return undefined;
    }
  }

  async reverseResolve(
    address: string,
    _: string
  ): Promise<ReverseResolutionResult | undefined> {
    try {
      const data = await dataService.getOwnedNames({
        address,
        page: 1,
        take: 1,
      });

      if (data?.items?.[0]?.name) {
        return {
          name: data.items[0].name,
          ttl: 30,
        };
      } else {
        return undefined;
      }
    } catch (error) {
      console.warn(error);
      return undefined;
    }
  }
}
