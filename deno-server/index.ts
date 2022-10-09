import { Application, Router } from "https://deno.land/x/oak@v10.0.0/mod.ts";
import { applyGraphQL, gql, GQLError } from "https://deno.land/x/oak_graphql/mod.ts";

const app = new Application();

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const types = gql`
type User {

  """  
  The user personal nasme
  """
  name: String
  age: Int
  posts: [Post]
  """
   Get last user followers
  """
  followers(last: Int):[Follower]
}
type Post {
  title: String
  content: String
}
type Follower {
  name: String
  age: Int
}
type Query {
  """
  Fetch the user data, you can get the posts and followers of a specific user
  """
  User(id: String): User
}
type Mutation {
  addUser(name: String, age: Int): User
}
`;
const mockUsers = [
  {
    id: "1",
    name: 'Chinua Achebe',
    age: 34,
  },
  {
    id: "2",
    name: 'Stephen King',
    age: 67,

  }
]
const mockPosts = [
  {
    id: "1",
    title: 'Post title 1',
    content: `This is the content part post 1`,
    userId: "1",
  },
  {
    id: "2",
    title: 'The Outsider',
    content: `This is the content part post 1`,
    userId: "2",

  },
  {
    id: "3",
    title: 'IT',
    content: `This is the content part post 1`,
    userId: "2",

  }
]



const resolvers = {
  Query: {
    User: (parent: any, { id }: { id: string }, context: any, info: any) => {
      const user = mockUsers.find(user => user.id === id);
      return user
    },
  },
  Mutation: {
    addUser: (parent: any, { name, age }: any, context: any, info: any) => {
      const user = {name, age, id: `${mockUsers.length++}`};
      mockUsers.push(user)
      return user
    },
  },
  User: {
    followers: (user, { last }: { last: number }) => {
      return mockUsers.slice(0, last)
    },
    posts: (user) => {
      return mockPosts.filter(post => post.userId === user.id);
    }
  },
};

const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: types,
  resolvers: resolvers,
  context: (ctx) => {
    // this line is for passing a user context for the auth
    return {};
  }
})


app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

console.log("Server start at http://localhost:8080/graphql");
await app.listen({ port: 8080 });