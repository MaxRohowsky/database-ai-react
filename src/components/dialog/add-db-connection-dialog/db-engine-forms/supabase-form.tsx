import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

export default function SupabaseForm({
  form,
}: {
  form: UseFormReturn<SupabaseConnectionDetails>;
}) {
  return (
    <>
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="host"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Host</FormLabel>
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
              <FormLabel>Port</FormLabel>
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
            <FormLabel>Database</FormLabel>
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
            <FormLabel>Username</FormLabel>
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
            <FormLabel>Password</FormLabel>
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
                Certificate: {field.value.name}
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
}
