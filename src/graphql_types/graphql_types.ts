import { GraphQLScalarType, Kind } from "graphql";
import { Point } from "geojson";

export const PointScalar = new GraphQLScalarType({
  name: "Point",
  description: "Geojson scalar point type",
  serialize(value: unknown): string {
    // check the type of received value
    if (!(typeof value == "object")) {
      throw new Error("PointScalar can only serialize Position values");
    }
    return JSON.stringify(value); // value sent to the client
  },
  parseValue(value: unknown): string {
    // check the type of received value
    if (typeof value !== "string") {
      throw new Error("PointScalar can only parse string values");
    }
    let val :number[] = JSON.parse(value);
    return `(${val[0]},${val[1]})`; // value from the client input variables
  },
  parseLiteral(ast): Point {
    // check the type of received value
    if (ast.kind !== Kind.STRING) {
      throw new Error("PointScalar can only parse string values");
    }
    return JSON.parse(ast.value); // value from the client query
  },
});
