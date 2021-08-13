import { Arg, Mutation, PubSub, PubSubEngine, Query, Resolver, Root, Subscription } from "type-graphql";

@Resolver()
export class HelloResolver {
    @Query(() => String)
    hello() {
        return "hello world"
    }

    @Subscription(() => String, {topics: "HELLO"})
    helloSubscription(
        @Root() message: String,  
    ) : String {
        return message;
    }

    @Mutation(() => Boolean) 
    async helloMutation(
        @Arg("message") message: String,
        @PubSub() pubSub: PubSubEngine,
    ) : Promise<Boolean> {
        await pubSub.publish("HELLO", message);
        return true;   
    }
    
}