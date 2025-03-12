"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, User, LockKeyhole, Unlock, Users, Camera, Download, Check, Clock, Edit3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import html2canvas from "html2canvas-pro";
import ExportTemplate from "@/components/ExportTemplate";
import { Participant } from "@/types/types";

// Add a custom style that will be used only for the export
const exportStyles = `
.cost-card-export {
  background-color: var(--background);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid var(--border);
  max-width: 600px;
  margin: 0 auto;
}
.cost-card-export h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
}
.cost-card-export .cost-value {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
}
.cost-card-export .cost-details {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
`;

// Salary range options
const SALARY_RANGES = [
  { label: "$0-$25/hr", min: 0, max: 25, value: "0-25" },
  { label: "$26-$50/hr", min: 26, max: 50, value: "26-50" },
  { label: "$51-$75/hr", min: 51, max: 75, value: "51-75" },
  { label: "$76-$100/hr", min: 76, max: 100, value: "76-100" },
  { label: "$101-$150/hr", min: 101, max: 150, value: "101-150" },
  { label: "$151-$200/hr", min: 151, max: 200, value: "151-200" },
  { label: "$201-$300/hr", min: 201, max: 300, value: "201-300" },
  { label: "$301-$500/hr", min: 301, max: 500, value: "301-500" },
  { label: "$500+/hr", min: 500, max: 750, value: "500+" }, // Using an arbitrary max for calculation
];

// Common team sizes for quick setting
const COMMON_TEAM_SIZES = [
  { label: "Just me", value: 1 },
  { label: "Small huddle (2)", value: 2 },
  { label: "Team meeting (5)", value: 5 },
  { label: "Department (10)", value: 10 },
  { label: "Large group (15+)", value: 15 },
];

export default function Home() {
  // Export status
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  
  // Export configuration
  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const [meetingName, setMeetingName] = useState<string>("Meeting Cost Summary");
  const [isEditingMeetingName, setIsEditingMeetingName] = useState<boolean>(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Update theme state when it changes
  useEffect(() => {
    const updateThemeState = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Set initial state
    updateThemeState();
    
    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeState();
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, []);
  
  // Toggle between exact rates and salary ranges
  const [useExactRates, setUseExactRates] = useState<boolean>(true);

  // State for participants with individual hourly rates
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "", hourlyRate: "", salaryRange: "" }
  ]);
  
  // State for meeting duration - default to 1 hour
  const [duration, setDuration] = useState<string>("1");
  const [timeUnit, setTimeUnit] = useState<string>("hours");
  
  // State for calculation and validation
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  
  // State for bulk participant management
  const [customParticipantCount, setCustomParticipantCount] = useState<string>("");
  const [showParticipantDetails, setShowParticipantDetails] = useState<boolean>(true);

  // Calculate meeting cost whenever inputs change
  useEffect(() => {
    calculateCost();
  }, [participants, duration, timeUnit, useExactRates]);

  // Helper function to validate inputs
  const isValidInput = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 1; // Minimum duration is 1
  };

  // Toggle between exact rates and salary ranges
  const toggleRateMode = () => {
    setUseExactRates(!useExactRates);
  };

  // Add a new participant
  const addParticipant = () => {
    // Copy the hourly rate from the last participant if available
    const lastParticipant = participants[participants.length - 1];
    const newHourlyRate = lastParticipant.hourlyRate || "";
    const newSalaryRange = lastParticipant.salaryRange || "";
    
    setParticipants([
      ...participants, 
      { 
        id: Date.now().toString(), 
        name: "", 
        hourlyRate: newHourlyRate, 
        salaryRange: newSalaryRange 
      }
    ]);
  };

  // Set a specific number of participants (replaces current list)
  const setParticipantCount = (count: number) => {
    // Get rate from first participant to apply to all new participants
    const existingRate = participants[0]?.hourlyRate || "";
    const existingSalaryRange = participants[0]?.salaryRange || "";
    
    // Preserve existing participants up to the count
    const existingToKeep = participants.slice(0, count);
    
    // Create new participants if needed
    const additionalNeeded = count - existingToKeep.length;
    const newParticipants = additionalNeeded > 0 
      ? Array.from({ length: additionalNeeded }, (_, index) => ({
          id: (Date.now() + index).toString(),
          name: "",
          hourlyRate: existingRate,
          salaryRange: existingSalaryRange
        }))
      : [];
    
    setParticipants([...existingToKeep, ...newParticipants]);
  };

  // Handle custom participant count set
  const handleSetCustomParticipants = () => {
    const count = parseInt(customParticipantCount);
    if (!isNaN(count) && count > 0) {
      setParticipantCount(count);
      setCustomParticipantCount("");
    }
  };

  // Remove a participant
  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  // Update participant details
  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setHasInteracted(true);
    setParticipants(
      participants.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  // Update all participants with the same rate
  const applyRateToAll = (value: string) => {
    setHasInteracted(true);
    if (useExactRates) {
      setParticipants(
        participants.map(p => ({ ...p, hourlyRate: value }))
      );
    } else {
      setParticipants(
        participants.map(p => ({ ...p, salaryRange: value }))
      );
    }
  };

  // Handle duration change with validation
  const handleDurationChange = (value: string) => {
    setHasInteracted(true);
    // Allow empty string for UX
    if (value === "") {
      setDuration(value);
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Ensure minimum value of 1
      if (numValue < 1) {
        setDuration("1");
      } else {
        setDuration(value);
      }
    }
  };

  // Export the result as a high-quality image
  const exportAsImage = async (format: 'png' | 'jpg' = 'png') => {
    if (!exportTemplateRef.current) return;

    try {
      setExportStatus('Preparing...');
      
      // Force update the dark mode state before export
      const currentIsDarkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(currentIsDarkMode);
      
      // Temporarily hide any scrollbars
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Take screenshot with html2canvas-pro at high resolution
      setExportStatus('Capturing...');
      
      const canvas = await html2canvas(exportTemplateRef.current, {
        scale: 3, // Higher resolution (3x)
        useCORS: true,
        allowTaint: true,
        backgroundColor: currentIsDarkMode ? '#1e1e2e' : '#ffffff',
        logging: false,
        // Improve rendering quality
        imageTimeout: 0,
        ignoreElements: (element) => {
          // Ignore any hidden elements that might cause problems
          const style = window.getComputedStyle(element);
          return style.display === 'none' || style.visibility === 'hidden';
        },
        onclone: (clonedDoc) => {
          // Set darkmode class on the cloned document to preserve theme
          if (currentIsDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
          } else {
            clonedDoc.documentElement.classList.remove('dark');
          }
          
          // Force all oklch colors to be applied properly in the cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            // This forces a reflow/repaint with all styles applied
            if (el instanceof HTMLElement) {
              void el.offsetHeight;
            }
          });
          return clonedDoc;
        }
      });
      
      // Restore original body style
      document.body.style.overflow = originalOverflow;
      
      // Convert to data URL and download
      setExportStatus('Downloading...');
      
      let dataUrl;
      if (format === 'png') {
        dataUrl = canvas.toDataURL('image/png');
      } else {
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `meeting-cost-${meetingName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      
      setExportStatus('Saved!');
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 2000);
    }
  };

  // Calculate individual cost for a participant
  const calculateIndividualCost = (participant: Participant): number => {
    if (!duration) return 0;
    
    const timeDuration = parseFloat(duration);
    let rate = 0;
    
    if (useExactRates) {
      rate = parseFloat(participant.hourlyRate || "0");
    } else {
      rate = getSalaryRangeMidpoint(participant.salaryRange);
    }
    
    return timeUnit === "hours" 
      ? rate * timeDuration 
      : rate * (timeDuration / 60);
  };

  // Get the midpoint of a salary range for calculation
  const getSalaryRangeMidpoint = (rangeValue: string): number => {
    const range = SALARY_RANGES.find(r => r.value === rangeValue);
    if (!range) return 0;
    return (range.min + range.max) / 2;
  };

  // Calculate the total meeting cost
  const calculateCost = () => {
    // Reset error
    setError(null);
    
    // Validate duration input
    if (!duration) {
      setTotalCost(null);
      return;
    }
    
    if (!isValidInput(duration)) {
      if (hasInteracted) {
        setError("Please enter a valid duration (minimum 1)");
      }
      setTotalCost(null);
      return;
    }
    
    // Check if any participant doesn't have valid rate information
    const invalidParticipant = participants.some(p => {
      if (useExactRates) {
        return !p.hourlyRate || !isValidInput(p.hourlyRate);
      } else {
        return !p.salaryRange;
      }
    });
    
    if (invalidParticipant && hasInteracted) {
      setError("Please set a valid rate for all participants");
      setTotalCost(null);
      return;
    }
    
    // Calculate individual costs and sum them up to ensure consistency
    let sum = 0;
    for (const participant of participants) {
      sum += calculateIndividualCost(participant);
    }
    
    // Round to 2 decimal places
    const roundedTotalCost = parseFloat(sum.toFixed(2));
    
    setTotalCost(roundedTotalCost);
  };

  // Generate a display label for a participant's rate
  const getParticipantRateDisplay = (participant: Participant, index: number) => {
    if (useExactRates) {
      return `$${participant.hourlyRate}/hr`;
    } else {
      const range = SALARY_RANGES.find(r => r.value === participant.salaryRange);
      return range ? range.label : "Not set";
    }
  };
  
  // Format money for display with appropriate precision
  const formatMoney = (amount: number): string => {
    // Show cents only if the amount is small or has significant cents
    if (amount < 100 || amount % 1 > 0.01) {
      return amount.toFixed(2);
    }
    return amount.toFixed(0);
  };

  // Toggle showing participant details
  const toggleParticipantDetails = () => {
    setShowParticipantDetails(!showParticipantDetails);
  };

  // Clear calculation for person-hours
  const calculatePersonHours = (): string => {
    if (!duration || !isValidInput(duration) || !participants.length) return "0";
    
    const timeDuration = parseFloat(duration);
    
    // For hours, multiply participants by hours
    // For minutes, convert to hours first (minutes / 60) then multiply by participants
    const totalHours = timeUnit === "hours" 
      ? timeDuration * participants.length 
      : (timeDuration / 60) * participants.length;
    
    // Format with one decimal place if there's a fractional part
    return totalHours % 1 === 0 ? totalHours.toString() : totalHours.toFixed(1);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-background">
      {/* Hidden export template for high-quality image capture */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden">
        <ExportTemplate
          ref={exportTemplateRef}
          participants={participants}
          totalCost={totalCost}
          duration={duration}
          timeUnit={timeUnit}
          useExactRates={useExactRates}
          getSalaryRangeMidpoint={getSalaryRangeMidpoint}
          calculateIndividualCost={calculateIndividualCost}
          calculatePersonHours={calculatePersonHours}
          formatMoney={formatMoney}
          meetingName={meetingName}
          isDarkMode={isDarkMode}
        />
      </div>
    
      <Card className="w-full max-w-5xl relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex flex-col items-center">
            <CardTitle className="text-center text-2xl font-bold">Major Financial Decision: $390 per Meeting</CardTitle>
            <CardDescription className="text-center">Discover how much your meetings are really costing you</CardDescription>
            
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="button"
                variant={useExactRates ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={toggleRateMode}
              >
                <Unlock className="h-4 w-4" />
                Exact Rates
              </Button>
              <Button
                type="button"
                variant={!useExactRates ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={toggleRateMode}
              >
                <LockKeyhole className="h-4 w-4" />
                Privacy Mode
              </Button>
            </div>
            
            {!useExactRates && (
              <p className="text-xs text-muted-foreground mt-2 max-w-md text-center">
                Privacy mode uses salary ranges instead of exact figures - perfect for sharing with colleagues
              </p>
            )}
          </div>
        </CardHeader>
        
        {/* Cost display at the top for immediate visibility */}
        <div className="w-full px-6 py-4 bg-secondary/30 border-y">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Your meeting costs</h3>
              <p className="text-3xl font-bold">
                ${totalCost !== null ? formatMoney(totalCost) : "0"}
              </p>
              <p className="text-xs text-muted-foreground">
                {participants.length} {participants.length === 1 ? 'person' : 'people'} for {duration || '1'} {timeUnit}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Per person</p>
              <p className="font-semibold">
                ${totalCost !== null && participants.length > 0 
                  ? formatMoney(totalCost / participants.length) 
                  : "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total time spent: {calculatePersonHours()}
              </p>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Label htmlFor="duration" className="text-sm flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Duration:
                </Label>
                <div className="flex items-center">
                  <Input
                    id="duration"
                    type="number"
                    placeholder="1"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    min="1"
                    step="1"
                    className="w-20 h-8"
                  />
                  
                  <Select value={timeUnit} onValueChange={setTimeUnit}>
                    <SelectTrigger id="timeUnit" className="w-24 h-8 ml-2">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-end mt-2 gap-2">
                {/* Export image name input */}
                <div className="flex items-center mr-2">
                  {isEditingMeetingName ? (
                    <div className="flex items-center">
                      <Input
                        value={meetingName}
                        onChange={(e) => setMeetingName(e.target.value)}
                        className="h-8 w-48 text-xs"
                        placeholder="Meeting name for export"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 ml-1"
                        onClick={() => setIsEditingMeetingName(false)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => setIsEditingMeetingName(true)}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> {meetingName}
                    </Button>
                  )}
                </div>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={() => exportAsImage('png')}
                  disabled={!!exportStatus}
                >
                  {exportStatus ? exportStatus : <>
                    <Camera className="h-3.5 w-3.5" /> Export as Image
                  </>}
                </Button>
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm font-medium text-red-500 mt-2">{error}</p>}
        </div>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              {/* Participant management header */}
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-1 font-medium">
                    <Users className="h-4 w-4" /> 
                    Who's attending?
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleParticipantDetails}
                    className="flex items-center gap-1"
                  >
                    {showParticipantDetails ? "Hide Details" : "Show Details"}
                  </Button>
                </div>
              </div>
              
              {/* Team size selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quickSet" className="text-sm block">Team style:</Label>
                  <Select onValueChange={(val) => {
                    setParticipantCount(parseInt(val));
                  }}>
                    <SelectTrigger id="quickSet" className="w-full">
                      <SelectValue placeholder="Choose size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value.toString()}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm block">Exact number:</Label>
                  <div className="flex items-center w-full">
                    <Input
                      type="number"
                      placeholder="e.g. 8"
                      value={customParticipantCount}
                      onChange={(e) => setCustomParticipantCount(e.target.value)}
                      min="1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSetCustomParticipants}
                      disabled={!customParticipantCount || parseInt(customParticipantCount) <= 0}
                      className="flex items-center gap-1 ml-2"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Set
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-end justify-start md:justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addParticipant}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Person
                  </Button>
                </div>
              </div>
              
              {/* Bulk rate setting */}
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                  <div className="flex items-center">
                    <Label className="whitespace-nowrap flex items-center gap-1 min-w-[120px]">
                      <span>{useExactRates ? "Everyone earns:" : "Everyone's in range:"}</span>
                    </Label>
                  </div>
                  
                  <div className="flex-1">
                    {useExactRates ? (
                      <div className="flex items-center">
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          className="w-full max-w-40"
                          min="1"
                          step="1"
                          onChange={(e) => {
                            if (e.target.value) applyRateToAll(e.target.value);
                          }}
                        />
                        <span className="ml-2 text-sm">$/hr</span>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(value) => applyRateToAll(value)}
                      >
                        <SelectTrigger className="w-full max-w-60">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {SALARY_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <p className="text-xs text-muted-foreground">
                      {participants.length > 1 && "Applies to all " + participants.length + " attendees"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Participant details - visible by default now */}
            {showParticipantDetails && (
              <div className="mt-6 space-y-3">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border p-3 rounded-md bg-card">
                    <div className="md:col-span-5">
                      <Label htmlFor={`name-${participant.id}`} className="text-sm mb-1 block">Name (Optional)</Label>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input
                          id={`name-${participant.id}`}
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, "name", e.target.value)}
                          placeholder={`Person ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-6">
                      {useExactRates ? (
                        <>
                          <Label htmlFor={`rate-${participant.id}`} className="text-sm mb-1 block">Hourly Rate (USD)</Label>
                          <Input
                            id={`rate-${participant.id}`}
                            type="number"
                            placeholder="e.g., 50"
                            value={participant.hourlyRate}
                            onChange={(e) => updateParticipant(participant.id, "hourlyRate", e.target.value)}
                            min="1"
                            step="1"
                            className="w-full"
                          />
                        </>
                      ) : (
                        <>
                          <Label htmlFor={`range-${participant.id}`} className="text-sm mb-1 block">Salary Range</Label>
                          <Select
                            value={participant.salaryRange}
                            onValueChange={(value) => updateParticipant(participant.id, "salaryRange", value)}
                          >
                            <SelectTrigger id={`range-${participant.id}`} className="w-full">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              {SALARY_RANGES.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                  {range.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                    
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 h-9 w-9"
                        onClick={() => removeParticipant(participant.id)}
                        disabled={participants.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          {/* Cost breakdown */}
          {totalCost !== null && participants.length > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-1">
                  <span>Breakdown</span>
                  {participants.length > 1 && <span className="text-xs text-muted-foreground">
                    (Showing how the ${formatMoney(totalCost)} total is distributed)
                  </span>}
                </h3>
                {!useExactRates && (
                  <p className="text-xs text-muted-foreground italic">
                    *Using midpoint of each range for calculations
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {participants.map((participant, index) => {
                  // Skip if no valid rate info
                  if ((useExactRates && !participant.hourlyRate) || 
                      (!useExactRates && !participant.salaryRange)) {
                    return null;
                  }
                  
                  const individualCost = calculateIndividualCost(participant);
                  const rateDisplay = getParticipantRateDisplay(participant, index);
                  
                  return (
                    <div key={participant.id} className="flex justify-between text-sm">
                      <span>{participant.name || `Person ${index + 1}`} ({rateDisplay})</span>
                      <span>${formatMoney(individualCost)}</span>
                    </div>
                  );
                })}
              </div>
              
              {participants.length > 2 && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  That's ${formatMoney(totalCost / 60)} per minute for this group
                </p>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}