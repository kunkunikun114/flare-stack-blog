import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { baseMiddleware } from "@/lib/hono/middlewares";
import { getServiceContext, setCacheHeaders } from "@/lib/hono/helper";
import { FindPostBySlugInputSchema } from "@/features/posts/posts.schema";
import * as PostService from "@/features/posts/posts.service";

const app = new Hono<{ Bindings: Env }>();

app.use("*", baseMiddleware);

const route = app.get(
  "/:slug",
  zValidator("param", FindPostBySlugInputSchema),
  async (c) => {
    const { slug } = c.req.valid("param");
    const result = await PostService.findPostBySlug(getServiceContext(c), {
      slug,
    });
    setCacheHeaders(c.res.headers, "public");
    return c.json(result);
  },
);

export default route;
