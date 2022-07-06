# whatado-server

## For Nate:

all the database queries happen in the resolvers. TypeOrm is the library we use to interact with the PostgreSQL database. 
Graphql passes the parameters to the resolver functions. Models are defined in src/entities. TypeOrm has decorators on the 
entities that describe relationships between tables and datatypes of the columns.
