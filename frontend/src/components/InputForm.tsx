import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SquarePen, Brain, Send, StopCircle, Zap, Cpu, Server } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated InputFormProps
interface InputFormProps {
  onSubmit: (inputValue: string, effort: string, model: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  hasHistory: boolean;
}

interface LlmConfig {
  llm_provider: string;
  gemini_query_generator_model: string;
  gemini_reflection_model: string;
  gemini_answer_model: string;
  deepseek_query_generator_model: string;
  deepseek_reflection_model: string;
  deepseek_answer_model: string;
}

interface AvailableModel {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  hasHistory,
}) => {
  const [internalInputValue, setInternalInputValue] = useState("");
  const [effort, setEffort] = useState("medium");
  const [model, setModel] = useState(""); // Will be set by useEffect
  const [llmProvider, setLlmProvider] = useState("");
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/llm-config");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LlmConfig = await response.json();

        setLlmProvider(data.llm_provider);
        let models: AvailableModel[] = [];

        if (data.llm_provider === "gemini") {
          models = [
            {
              value: data.gemini_query_generator_model,
              label: "Query Gen (Gemini)",
              icon: <Zap className="h-4 w-4 mr-2 text-yellow-400" />,
            },
            {
              value: data.gemini_reflection_model,
              label: "Reflection (Gemini)",
              icon: <Zap className="h-4 w-4 mr-2 text-orange-400" />,
            },
            {
              value: data.gemini_answer_model,
              label: "Answer Gen (Gemini)",
              icon: <Cpu className="h-4 w-4 mr-2 text-purple-400" />,
            },
          ];
        } else if (data.llm_provider === "deepseek") {
          models = [
            {
              value: data.deepseek_query_generator_model,
              label: "Query Gen (DeepSeek)",
              icon: <Server className="h-4 w-4 mr-2 text-green-400" />,
            },
            {
              value: data.deepseek_reflection_model,
              label: "Reflection (DeepSeek)",
              icon: <Server className="h-4 w-4 mr-2 text-teal-400" />,
            },
            {
              value: data.deepseek_answer_model,
              label: "Answer Gen (DeepSeek)",
              icon: <Server className="h-4 w-4 mr-2 text-cyan-400" />,
            },
          ];
        }
        setAvailableModels(models);
        if (models.length > 0) {
          setModel(models[0].value); // Set default model to the first in the list
        }
        setConfigLoaded(true);
      } catch (error) {
        console.error("Failed to fetch LLM configuration:", error);
        // Optionally, set some default models or show an error state
        setConfigLoaded(true); // Still set to true to unblock UI, but with defaults/error
      }
    };

    fetchConfig();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInputValue.trim()) return;
    onSubmit(internalInputValue, effort, model);
    setInternalInputValue("");
  };

  const handleInternalKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const isSubmitDisabled = !internalInputValue.trim() || isLoading;

  return (
    <form
      onSubmit={handleInternalSubmit}
      className={`flex flex-col gap-2 p-3 `}
    >
      <div
        className={`flex flex-row items-center justify-between text-white rounded-3xl rounded-bl-sm ${
          hasHistory ? "rounded-br-sm" : ""
        } break-words min-h-7 bg-neutral-700 px-4 pt-3 `}
      >
        <Textarea
          value={internalInputValue}
          onChange={(e) => setInternalInputValue(e.target.value)}
          onKeyDown={handleInternalKeyDown}
          placeholder="Who won the Euro 2024 and scored the most goals?"
          className={`w-full text-neutral-100 placeholder-neutral-500 resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none 
                        md:text-base  min-h-[56px] max-h-[200px]`}
          rows={1}
        />
        <div className="-mt-3">
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 cursor-pointer rounded-full transition-all duration-200"
              onClick={onCancel}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              className={`${
                isSubmitDisabled
                  ? "text-neutral-500"
                  : "text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
              } p-2 cursor-pointer rounded-full transition-all duration-200 text-base`}
              disabled={isSubmitDisabled}
            >
              Search
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2">
          <div className="flex flex-row gap-2 bg-neutral-700 border-neutral-600 text-neutral-300 focus:ring-neutral-500 rounded-xl rounded-t-sm pl-2  max-w-[100%] sm:max-w-[90%]">
            <div className="flex flex-row items-center text-sm">
              <Brain className="h-4 w-4 mr-2" />
              Effort
            </div>
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger className="w-[120px] bg-transparent border-none cursor-pointer">
                <SelectValue placeholder="Effort" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-700 border-neutral-600 text-neutral-300 cursor-pointer">
                <SelectItem
                  value="low"
                  className="hover:bg-neutral-600 focus:bg-neutral-600 cursor-pointer"
                >
                  Low
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="hover:bg-neutral-600 focus:bg-neutral-600 cursor-pointer"
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="high"
                  className="hover:bg-neutral-600 focus:bg-neutral-600 cursor-pointer"
                >
                  High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row gap-2 bg-neutral-700 border-neutral-600 text-neutral-300 focus:ring-neutral-500 rounded-xl rounded-t-sm pl-2  max-w-[100%] sm:max-w-[90%]">
            <div className="flex flex-row items-center text-sm ml-2">
              <Cpu className="h-4 w-4 mr-2" />
              Model {llmProvider && `(${llmProvider.charAt(0).toUpperCase() + llmProvider.slice(1)})`}
            </div>
            <Select value={model} onValueChange={setModel} disabled={!configLoaded || availableModels.length === 0}>
              <SelectTrigger className="w-[220px] bg-transparent border-none cursor-pointer">
                <SelectValue placeholder={configLoaded ? "Select model" : "Loading models..."} />
              </SelectTrigger>
              <SelectContent className="bg-neutral-700 border-neutral-600 text-neutral-300 cursor-pointer">
                {availableModels.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-neutral-600 focus:bg-neutral-600 cursor-pointer"
                  >
                    <div className="flex items-center">
                      {option.icon} {option.label}
                    </div>
                  </SelectItem>
                ))}
                {configLoaded && availableModels.length === 0 && (
                  <SelectItem value="no-models" disabled>
                    No models available. Check config.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasHistory && (
          <Button
            className="bg-neutral-700 border-neutral-600 text-neutral-300 cursor-pointer rounded-xl rounded-t-sm pl-2 "
            variant="default"
            onClick={() => window.location.reload()}
          >
            <SquarePen size={16} />
            New Search
          </Button>
        )}
      </div>
    </form>
  );
};
