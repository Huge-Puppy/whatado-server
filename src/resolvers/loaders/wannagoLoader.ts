import DataLoader from "dataloader";
import { Wannago } from "../../entities/Wannago";

// keys is an array [1,2,3,4]
// [{id: 1, wannagonam...}, {}]
export const createWannagoLoader = () =>
  new DataLoader<number, Wannago>(async (wannagoIds) => {
    const wannagos = await Wannago.findByIds(wannagoIds as number[], {
      relations: ["user"],
    });
    const wannagoIdToWannago: Record<number, Wannago> = {};
    wannagos.forEach((id) => {
      wannagoIdToWannago[id.id] = id;
    });

    return wannagoIds.map((wannagoId) => wannagoIdToWannago[wannagoId]);
  });
