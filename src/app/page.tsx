'use client';

import { useOpenClaw } from '@/hooks/useOpenClaw';
import Header from '@/components/Header';
import TabNav from '@/components/TabNav';
import TasksPanel from '@/components/TasksPanel';
import OutputsPanel from '@/components/OutputsPanel';
import GeniusPanel from '@/components/GeniusPanel';
import CreatePanel from '@/components/CreatePanel';

export default function Home() {
  const oc = useOpenClaw();

  return (
    <div className="min-h-dvh bg-background text-text">
      <Header status={oc.status} />
      <TabNav
        tab={oc.tab}
        setTab={oc.setTab}
        tasks={oc.tasks}
        outputCount={oc.outputs.length}
        geniusCount={oc.geniusItems.length}
      />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        {/* Global messages */}
        {oc.error && (
          <div className="mb-4 rounded-md border border-danger/50 bg-danger/10 p-3 text-sm text-danger" role="alert">
            {oc.error}
          </div>
        )}
        {oc.processing && (
          <div className="mb-4 rounded-md border border-warning/50 bg-warning/10 p-3 text-center text-sm text-warning" role="status">
            {oc.processing}
          </div>
        )}

        {oc.tab === 'tasks' && (
          <TasksPanel
            tasks={oc.tasks}
            input={oc.input}
            setInput={oc.setInput}
            loading={oc.loading}
            addTask={oc.addTask}
          />
        )}

        {oc.tab === 'outputs' && (
          <OutputsPanel
            outputs={oc.outputs}
            selectedOutputs={oc.selectedOutputs}
            processing={oc.processing}
            toggleOutput={oc.toggleOutput}
            mergeOutputs={oc.mergeOutputs}
          />
        )}

        {oc.tab === 'genius' && (
          <GeniusPanel
            geniusItems={oc.geniusItems}
            selectedGenius={oc.selectedGenius}
            toggleGenius={oc.toggleGenius}
          />
        )}

        {oc.tab === 'create' && (
          <CreatePanel
            result={oc.result}
            resultType={oc.resultType}
            processing={oc.processing}
            generateSocial={oc.generateSocial}
            generateImage={oc.generateImage}
            generatePodcast={oc.generatePodcast}
            generateVideo={oc.generateVideo}
            copyResult={oc.copyResult}
          />
        )}
      </main>
    </div>
  );
}
