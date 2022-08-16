import { GraphQLScalarType, Kind } from "graphql";
import { Point } from "geojson";

export const PointScalar = new GraphQLScalarType({
  name: "Point",
  description: "Geojson scalar point type",
  serialize(value: unknown): string {
    // check the type of received value
    if (!(typeof value == "object")) {
      let formattedString = (value as string)
        .replace("(", "[")
        .replace(")", "]");
      let val: number[] = JSON.parse(formattedString);
      return JSON.stringify({ x: val[0], y: val[1] });
    }
    return JSON.stringify(value); // value sent to the client
  },
  parseValue(value: unknown): any {
    // check the type of received value
    if (typeof value !== "string") {
      throw new Error("PointScalar can only parse string values");
    }
    let val: number[] = JSON.parse(value);
    let returnval = {
      type: "Point",
      coordinates: [val[0], val[1]],
      crs: { type: "name", properties: { name: "EPSG:4326" } },
    };
    return returnval; // value from the client input variables
  },
  parseLiteral(ast): Point {
    // check the type of received value
    if (ast.kind !== Kind.STRING) {
      throw new Error("PointScalar can only parse string values");
    }
    return JSON.parse(ast.value); // value from the client query
  },
});
