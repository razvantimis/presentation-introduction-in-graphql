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
type Book {
  title: String
}
type Author {
  name: String
  books: [Book]
}
type Query {
  # With a REST-based API, books and authors would probably be returned by different endpoints
  books: [Book]
  authors: [Author]
}
type Mutation {
  addBook(title: String, author: String): Book
}
`;

const books = [
  {
    id: 1,
    title: 'Things Fall Apart',
    authorId: 1
  },
  {
    id: 2,
    title: 'The Outsider',
    authorId: 2
  },
  {
    id: 3,
    title: 'IT',
    authorId: 2
  }
]

const authors = [
  {
    id: 1,
    name: 'Chinua Achebe'
  },
  {
    id: 2,
    name: 'Stephen King'
  }
]

const resolvers = {
  Query: {
    books: (parent: any, args: any, context: any, info: any) => {
      return books
    },
    authors: (parent: any, args: any, context: any, info: any) => {
      return authors;
    }
  },
  Mutation: {
    addBook: (parent: any, { title, author } : any, context: any, info: any) => {
      console.log("input:", title, author);
      const authorExist = authors.find(authorItem => authorItem.name === author)
      books.push({
        id: books.length + 1, 
        title,
        authorId: authorExist?.id ?? 1
      })
      return {
        title,
      };
    },
  },
  Author: {
    books: (author) => {
      return books.filter((book) => book.authorId === author.id);
    },
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