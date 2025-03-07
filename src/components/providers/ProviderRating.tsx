
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Rating {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    company_name: string;
  };
}

interface ProviderRatingProps {
  providerId: string;
  language?: "en" | "sw";
}

export const ProviderRating = ({
  providerId,
  language = "en",
}: ProviderRatingProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Translations
  const t = {
    en: {
      ratings: "Ratings",
      noRatings: "No ratings yet",
      rateProvider: "Rate this provider",
      submitRating: "Submit Rating",
      rateError: "Error submitting rating",
      commentPlaceholder: "Share your experience with this provider...",
      ratingSuccess: "Rating submitted successfully",
      loadingRatings: "Loading ratings...",
      anonymous: "Anonymous User",
    },
    sw: {
      ratings: "Tathmini",
      noRatings: "Hakuna tathmini bado",
      rateProvider: "Tathimini mtoa huduma huyu",
      submitRating: "Wasilisha Tathmini",
      rateError: "Hitilafu kuwasilisha tathmini",
      commentPlaceholder: "Shiriki uzoefu wako na mtoa huduma huyu...",
      ratingSuccess: "Tathmini imewasilishwa",
      loadingRatings: "Inapakia tathmini...",
      anonymous: "Mtumiaji Asiyejulikana",
    },
  };

  useEffect(() => {
    loadRatings();
  }, [providerId]);

  const loadRatings = async () => {
    if (!providerId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "service-provider-ratings",
        {
          method: "GET",
          query: { providerId },
        }
      );

      if (error) throw error;
      setRatings(data.ratings || []);
    } catch (error) {
      console.error("Error loading ratings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load ratings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!userRating) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke(
        "service-provider-ratings",
        {
          body: {
            providerId,
            rating: userRating,
            comment,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: t[language].ratingSuccess,
      });

      // Reset form and reload ratings
      setUserRating(0);
      setComment("");
      loadRatings();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: t[language].rateError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ));
  };

  const renderRatingStars = () => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-6 w-6 cursor-pointer ${
            i < (hoverRating || userRating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
          onClick={() => setUserRating(i + 1)}
          onMouseEnter={() => setHoverRating(i + 1)}
          onMouseLeave={() => setHoverRating(0)}
        />
      ));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">{t[language].ratings}</h3>

      {/* Rating Form */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium mb-2">{t[language].rateProvider}</h4>
        <div className="flex mb-3">{renderRatingStars()}</div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t[language].commentPlaceholder}
          className="mb-3"
        />
        <Button
          onClick={handleSubmitRating}
          disabled={!userRating || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {t[language].submitRating}
        </Button>
      </div>

      {/* Ratings List */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t[language].loadingRatings}</span>
          </div>
        ) : ratings.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {t[language].noRatings}
          </p>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="border p-3 rounded-md"
              >
                <div className="flex justify-between">
                  <div className="flex items-center space-x-1">
                    {renderStars(rating.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.comment && (
                  <p className="mt-2 text-sm">{rating.comment}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {rating.profiles?.company_name || t[language].anonymous}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
