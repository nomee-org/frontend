import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Calendar, Users, Vote } from "lucide-react";
import { CreatePollDto } from "@/types/backend";

interface PollCreatorProps {
  onPollChange: (poll: CreatePollDto | null) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const PollCreator = ({
  onPollChange,
  isVisible,
  onClose,
}: PollCreatorProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [duration, setDuration] = useState(24);

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      updatePoll();
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    updatePoll();
  };

  const updatePoll = () => {
    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (question.trim() && validOptions.length >= 2) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      onPollChange({
        question: question.trim(),
        options: validOptions,
        isAnonymous,
        allowMultiple,
        expiresAt: expiresAt.toISOString(),
      });
    } else {
      onPollChange(null);
    }
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    updatePoll();
  };

  const handleClose = () => {
    setQuestion("");
    setOptions(["", ""]);
    setIsAnonymous(false);
    setAllowMultiple(false);
    setDuration(24);
    onPollChange(null);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Vote className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Create Poll</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Ask your question..."
            value={question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="border-primary/20 focus:border-primary/40"
            maxLength={200}
          />

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 border-muted focus:border-primary/40"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-muted-foreground hover:text-destructive p-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="w-full text-primary hover:text-primary/80 hover:bg-primary/10 border-2 border-dashed border-primary/30"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add option
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Anonymous voting</span>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={(checked) => {
                  setIsAnonymous(checked);
                  updatePoll();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Vote className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Multiple selections</span>
              </div>
              <Switch
                checked={allowMultiple}
                onCheckedChange={(checked) => {
                  setAllowMultiple(checked);
                  updatePoll();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Duration (hours)</span>
              </div>
              <select
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value));
                  updatePoll();
                }}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>1 day</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
