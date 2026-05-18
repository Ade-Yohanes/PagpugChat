'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Play, Video, TestTube } from 'lucide-react';

interface Text2VideoTestProps {
  user: any;
}

export default function Text2VideoTest({ user }: Text2VideoTestProps) {
  const [prompt, setPrompt] = useState('A sunrise drone shot flying over a calm ocean');
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a text prompt');
      return;
    }

    if (!user) {
      setError('You must be logged in to use this feature');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const video = await window.puter.ai.txt2vid(prompt, testMode);

      // Assuming video is a blob or URL
      const url = video instanceof HTMLVideoElement ? video.src : URL.createObjectURL(video as any);
      setVideoUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-background">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TestTube className="h-8 w-8" />
          Text to Video Test
        </h1>
        <Button variant="ghost" size="sm" disabled={!user}>
          Welcome, {user?.username || 'Not logged in'}
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Generate Video from Text (Test Mode)
          </CardTitle>
          <CardDescription>
            Test the text-to-video feature without using credits. Enter a text description to generate a video.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Text Prompt</Label>
            <Input
              id="prompt"
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="testMode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="testMode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Test Mode (avoids using credits)
            </Label>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !user} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Test Video
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {videoUrl && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Generated Test Video</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              controls
              className="w-full rounded-lg"
              src={videoUrl}
              onLoadedData={(e) => {
                const video = e.target as HTMLVideoElement;
                video.play().catch(() => {});
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}