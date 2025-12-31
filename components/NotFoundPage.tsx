import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertCircle, LucideIcon } from "lucide-react";

interface NotFoundPageProps {
  title?: string;
  message?: string;
  buttonText?: string;
  buttonHref?: string;
  info?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  className?: string;
  show404?: boolean;
  cardClassName?: string;
}

export function NotFoundPage({
  title = "Oups ! Perdu ?",
  message = "Cette page semble avoir disparu dans la nature. Revenons sur le bon chemin.",
  buttonText = "Retour à l'accueil",
  buttonHref = "/dashboard",
  info = "Si le problème persiste, contactez notre support.",
  icon: Icon = AlertCircle,
  iconClassName = "text-destructive",
  iconBgClassName = "bg-destructive/10",
  className = "",
  show404 = true,
  cardClassName = "",
}: NotFoundPageProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-[60vh] ${className}`}
    >
      <Card className={`w-full max-w-md border shadow-lg ${cardClassName}`}>
        <CardContent className="p-8 text-center">
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className={`w-20 h-20 ${iconBgClassName} rounded-full flex items-center justify-center animate-pulse`}
              >
                <Icon className={`h-10 w-10 ${iconClassName}`} />
              </div>
              {show404 && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-medium animate-bounce">
                    404
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" className="gap-2">
              <Link href={buttonHref}>
                <Home className="h-4 w-4" />
                {buttonText}
              </Link>
            </Button>
          </div>

          {/* Footer */}
          {info && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground">{info}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
