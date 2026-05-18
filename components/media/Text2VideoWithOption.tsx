'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Video } from 'lucide-react';

interface Text2VideoProps {
  user: any;
}

export default function Text2Video({ user }: Text2VideoProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('sora-2-pro');
  const [seconds, setSeconds] = useState(8);
  const [size, setSize] = useState('1280x720');
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
      const video = await window.puter.ai.txt2vid(prompt, {
        model,
        seconds,
        size,
      });

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
        <h1 className="text-3xl font-bold">Text to Video</h1>
        <Button variant="ghost" size="sm" disabled={!user}>
          Welcome, {user?.username || 'Not logged in'}
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Generate Video from Text
          </CardTitle>
          <CardDescription>
            Enter a text description to generate a video using AI.
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sora-2-pro">Sora 2 Pro</SelectItem>
                  <SelectItem value="sora-2">Sora 2</SelectItem>
                  <SelectItem value="sora">Sora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seconds">Duration (seconds)</Label>
              <Input
                id="seconds"
                type="number"
                min="1"
                max="30"
                value={seconds}
                onChange={(e) => setSeconds(parseInt(e.target.value) || 8)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Resolution</Label>
              <Select value={size} onValueChange={setSize} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                  <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                  <SelectItem value="854x480">854x480 (SD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                Generate Video
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
            <CardTitle>Generated Video</CardTitle>
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