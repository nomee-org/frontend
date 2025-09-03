/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Vote, Users, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { IPoll, IPollOption, IPollVote } from "@/types/backend";
import {
  useVotePoll,
  useRemovePollVote,
  useGetPollResults,
} from "@/data/use-backend";
import moment from "moment";
import { toast } from "sonner";

interface PollDisplayProps {
  poll: IPoll;
  postId: string;
  userVotes?: IPollVote[];
  canVote?: boolean;
  showResults?: boolean;
}

export const PollDisplay = ({
  poll,
  postId,
  userVotes = [],
  canVote = true,
  showResults = false,
}: PollDisplayProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [showingResults, setShowingResults] = useState(showResults);

  const { mutate: votePoll, isPending: isVoting } = useVotePoll();
  const { mutate: removePollVote, isPending: isRemoving } = useRemovePollVote();
  const { data: pollResults } = useGetPollResults(postId);

  const isExpired = poll.expiresAt
    ? new Date(poll.expiresAt) < new Date()
    : false;
  const totalVotes = poll._count?.votes || 0;
  const userHasVoted = userVotes.length > 0;

  useEffect(() => {
    setHasVoted(userHasVoted);
    if (userVotes.length > 0) {
      setSelectedOptions(userVotes.map((vote) => vote.optionId));
    }
  }, [userVotes, userHasVoted]);

  const handleVote = () => {
    if (selectedOptions.length === 0) {
      toast.error("Please select at least one option");
      return;
    }

    votePoll(
      { postId, votePollDto: { optionIds: selectedOptions } },
      {
        onSuccess: () => {
          setHasVoted(true);
          setShowingResults(true);
          toast.success("Vote submitted successfully!");
        },
        onError: () => {
          toast.error("Failed to submit vote");
        },
      }
    );
  };

  const handleRemoveVote = () => {
    removePollVote(postId, {
      onSuccess: () => {
        setHasVoted(false);
        setSelectedOptions([]);
        setShowingResults(false);
        toast.success("Vote removed");
      },
      onError: () => {
        toast.error("Failed to remove vote");
      },
    });
  };

  const toggleShowResults = () => {
    setShowingResults(!showingResults);
  };

  const getOptionPercentage = (option: IPollOption) => {
    if (totalVotes === 0) return 0;
    const optionVotes =
      pollResults?.poll?.options?.find((opt: any) => opt.id === option.id)
        ?._count?.votes ||
      option._count?.votes ||
      0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getOptionVotes = (option: IPollOption) => {
    return (
      pollResults?.poll?.options?.find((opt: any) => opt.id === option.id)
        ?._count?.votes ||
      option._count?.votes ||
      0
    );
  };

  const handleOptionSelect = (optionId: string) => {
    if (!canVote || hasVoted || isExpired) return;

    if (poll.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Vote className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{poll.question}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {poll.isAnonymous && (
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Anonymous
              </Badge>
            )}
            {poll.allowMultiple && (
              <Badge variant="outline" className="text-xs">
                Multiple
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Ended
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {poll.allowMultiple && !showingResults && !hasVoted && !isExpired ? (
            // Multiple choice with checkboxes
            <div className="space-y-2">
              {poll?.options?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                  onClick={() => handleOptionSelect(option.id)}
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={() => handleOptionSelect(option.id)}
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          ) : !poll.allowMultiple &&
            !showingResults &&
            !hasVoted &&
            !isExpired ? (
            // Single choice with radio buttons
            <RadioGroup
              value={selectedOptions[0] || ""}
              onValueChange={(value) => handleOptionSelect(value)}
            >
              {poll?.options?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            // Results view
            <div className="space-y-3">
              {poll?.options?.map((option) => {
                const percentage = getOptionPercentage(option);
                const votes = getOptionVotes(option);
                const isSelected = selectedOptions.includes(option.id);

                return (
                  <div
                    key={option.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{option.text}</span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{votes} votes</span>
                        <span className="font-semibold text-foreground">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {totalVotes}
              <span className="hidden md:block">&nbsp;votes</span>
            </span>
            {poll.expiresAt && !isExpired && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {moment(poll.expiresAt).fromNow()}
              </span>
            )}
            {isExpired && (
              <span className="flex items-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                Ended {moment(poll.expiresAt).fromNow()}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!showingResults && !hasVoted && !isExpired && canVote && (
              <Button
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || isVoting}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isVoting ? "Voting..." : "Vote"}
              </Button>
            )}

            {hasVoted && !isExpired && (
              <Button
                onClick={handleRemoveVote}
                disabled={isRemoving}
                variant="outline"
                size="sm"
              >
                {isRemoving ? "Removing..." : "Change Vote"}
              </Button>
            )}

            {(hasVoted || totalVotes > 0) && (
              <Button
                onClick={toggleShowResults}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                {showingResults ? (
                  <>
                    <Vote className="w-4 h-4 mr-1" />
                    <span>
                      <span className="hidden md:block">Hide&nbsp;</span>Results
                    </span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-1" />
                    <span className="flex">
                      <span className="hidden md:block">Show&nbsp;</span>Results
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
