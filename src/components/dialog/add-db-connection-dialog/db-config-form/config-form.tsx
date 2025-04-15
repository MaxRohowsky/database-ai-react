import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

export default function ConfigForm({
  form,
}: {
  form: UseFormReturn<ConnectionDetails>;
}) {
  return (
    <>
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="host"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
                Host
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="localhost"
                  className="placeholder:text-gray-400 placeholder:opacity-60"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem className="w-30">
              <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
                Port
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="5432"
                  className="placeholder:text-gray-400 placeholder:opacity-60"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="database"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
              Database
            </FormLabel>
            <FormControl>
              <Input
                placeholder="my_database"
                className="placeholder:text-gray-400 placeholder:opacity-60"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="user"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
              Username
            </FormLabel>
            <FormControl>
              <Input
                placeholder="postgres"
                className="placeholder:text-gray-400 placeholder:opacity-60"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
              Password
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="••••••••"
                className="placeholder:text-gray-400 placeholder:opacity-60"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="certFile"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SSL Certificate</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".crt,.pem"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  field.onChange(file);
                }}
              />
            </FormControl>
            {field.value && (
              <p className="text-muted-foreground text-xs">
                Certificate:{" "}
                {typeof field.value === "string"
                  ? "Certificate loaded (previously uploaded)"
                  : `Certificate: ${field.value.name}`}
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
}
