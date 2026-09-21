"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSpatialStore } from "@/store/useSpatialStore";
import LocationDropdown from "./LocationDropdown";
import { useState } from "react";

const taskFormSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters long"),
  category: z.enum(["Work", "Shopping", "Personal"]),
  dueDate: z
    .string()
    .min(1, "Please select a valid date")
    .refine((dateStr) => {
      const selectedDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, "Due date cannot be set in the past"),
  spatialData: z.object(
    {
      lat: z
        .number()
        .min(-90, "Latitude cannot be less than -90 degrees")
        .max(90, "Latitude cannot exceed 90 degrees"),
      lng: z
        .number()
        .min(-180, "Longitude cannot be less than -180 degrees")
        .max(180, "Longitude cannot exceed 180 degrees"),
      city: z.string().min(1, "City identifier is required"),
      country: z.string().min(1, "Country identifier is required"),
    },
    { error: "Please search and select a targeting location vector" },
  ),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface BroadcastTaskAck {
  ok: boolean;
  message?: string;
}

export default function TaskForm() {
  const socket = useSpatialStore((state) => state.socket);
  const [serverError, setServerError] = useState<string | null>(null);
  const [locationResetSignal, setLocationResetSignal] = useState(0);

  const todayString = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      category: "Work",
      dueDate: "",
      spatialData: undefined,
    },
  });

  const selectedSpatialData = useWatch({
    control,
    name: "spatialData",
  });

  const onSubmit = async (data: TaskFormData) => {
    if (!socket) {
      console.error("❌ Socket pipeline is offline. Cannot broadcast payload.");
      setServerError(
        "The task connection is still starting. Please try again.",
      );
      return;
    }

    try {
      setServerError(null);
      const payload = {
        title: data.title,
        category: data.category,
        dueDate: new Date(data.dueDate).toISOString(),
        lat: String(data.spatialData.lat),
        lng: String(data.spatialData.lng),
        city: data.spatialData.city,
        country: data.spatialData.country,
      };
      const result = (await socket
        .timeout(10000)
        .emitWithAck("broadcast-task", payload)) as BroadcastTaskAck;

      if (!result.ok) {
        setServerError(result.message || "The task could not be saved.");
        return;
      }

      reset({
        title: "",
        category: "Work",
        dueDate: "",
        spatialData: undefined,
      });
      setLocationResetSignal((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Failed broadcasting spatial task entry:", err);
      setServerError("The task could not be saved. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
          Task Node Constructor
        </h3>
        <p className="text-[10px] font-mono text-slate-400">
          Deploy fresh spatial task arrays onto the coordinate engine
        </p>
      </div>

      {serverError && (
        <p className="text-[10px] font-mono text-rose-500 text-left">
          {serverError}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 text-left block">
          TASK TITLE
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="What needs to be done?"
          className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
        />
        {errors.title && (
          <p className="text-[10px] font-mono text-rose-500 text-left mt-0.5">
            ⚠️ {errors.title.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 text-left block">
            CATEGORY
          </label>
          <select
            {...register("category")}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          >
            <option value="Work">Work</option>
            <option value="Shopping">Shopping</option>
            <option value="Personal">Personal</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 text-left block">
            DUE DATE
          </label>
          <input
            {...register("dueDate")}
            type="date"
            min={todayString}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
          {errors.dueDate && (
            <p className="text-[10px] font-mono text-rose-500 text-left mt-0.5">
              ⚠️ {errors.dueDate.message}
            </p>
          )}
        </div>
      </div>

      <Controller
        name="spatialData"
        control={control}
        render={({ field }) => (
          <LocationDropdown
            key={locationResetSignal}
            onLocationSelect={(data) => field.onChange(data)}
          />
        )}
      />
      {errors.spatialData && (
        <p className="text-[10px] font-mono text-rose-500 text-left mt-0.5">
          ⚠️ {errors.spatialData.message}
        </p>
      )}

      {selectedSpatialData && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-0.5 text-left">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
            Validated Targeting Vector
          </p>
          <p className="text-xs font-bold text-indigo-500">
            {selectedSpatialData.city}, {selectedSpatialData.country}
          </p>
          <p className="text-[10px] font-mono text-slate-400">
            Coords: {selectedSpatialData.lat.toFixed(5)},{" "}
            {selectedSpatialData.lng.toFixed(5)}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
      >
        {isSubmitting ? "Broadcasting..." : "Broadcast Spatial Task Node"}
      </button>
    </form>
  );
}
