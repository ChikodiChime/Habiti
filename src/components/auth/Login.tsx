/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import toast from "react-hot-toast";
import { client } from "@/src/lib/client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
type LoginProps = {
  onSubmit?: (values: {
    email: string;
    password: string;
  }) => void | Promise<void>;
};

const Login: React.FC<LoginProps> = () => {
  const router = useRouter();
  return (
    <div className="flex h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-950 to-black px-4 text-slate-50">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.9)] backdrop-blur-xl"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-400/80">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              Log in to Habiti
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Continue your streaks and keep your habits honest.
            </p>
          </div>

          <Formik
            initialValues={{ email: "", password: "" }}
            validate={(values) => {
              const errors: Partial<typeof values> = {};
              if (!values.email) {
                errors.email = "Enter your email";
              }
              if (!values.password) {
                errors.password = "Enter your password";
              }
              return errors;
            }}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const email = values.email;
                const password = values.password;

                const { error } = await client.auth.signInWithPassword({
                  email,
                  password,
                });

                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success("Signed in successfully");
                  router.push("/dashboard");
                }
              } catch (err: any) {
                toast.error(err?.message ?? "Something went wrong");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    className="text-sm font-medium text-slate-200"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-orange-500 focus:bg-slate-900 focus:ring-2 focus:ring-orange-500/40"
                    placeholder="you@example.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-xs text-red-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-sm font-medium text-slate-200"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-orange-500 focus:bg-slate-900 focus:ring-2 focus:ring-orange-500/40"
                    placeholder="••••••••"
                  />
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-xs text-red-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_40px_rgba(249,115,22,0.55)] transition hover:bg-orange-400 hover:shadow-[0_18px_55px_rgba(249,115,22,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </Form>
            )}
          </Formik>

          <p className="mt-6 text-center text-xs text-slate-400">
            New to Habiti?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-orange-400 underline-offset-4 transition hover:underline hover:text-orange-300"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
