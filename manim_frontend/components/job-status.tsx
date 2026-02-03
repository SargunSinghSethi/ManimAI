import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"

interface JobStatusProps {
  status: string
}

export function JobStatus({ status }: JobStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          text: "Pending",
          description: "Your animation request has been received and is waiting to be processed.",
          color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
        }
      case "PROCESSING":
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
          text: "Processing",
          description: "Your animation is being generated. This may take a few minutes.",
          color: "border-blue-500/20 bg-blue-500/10 text-blue-500",
        }
      case "COMPLETED":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: "Completed",
          description: "Your animation has been successfully generated!",
          color: "border-green-500/20 bg-green-500/10 text-green-500",
        }
      case "FAILED":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          text: "Failed",
          description: "There was an error generating your animation. Please try again with a different prompt.",
          color: "border-red-500/20 bg-red-500/10 text-red-500",
        }
      case "TIMEOUT":
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
          text: "Timeout",
          description: "The request is taking longer than expected. It might still be processing.",
          color: "border-orange-500/20 bg-orange-500/10 text-orange-500",
        }
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          text: "Unknown",
          description: "The status of your animation is unknown.",
          color: "border-gray-500/20 bg-gray-500/10 text-gray-500",
        }
    }
  }

  const { icon, text, description, color } = getStatusDisplay()

  return (
    <Card className={`flex items-start p-4 border ${color}`}>
      <div className="mr-3 mt-0.5">{icon}</div>
      <div>
        <h3 className="font-medium">{text}</h3>
        <p className="text-sm mt-1 text-muted-foreground">{description}</p>
      </div>
    </Card>
  )
}
