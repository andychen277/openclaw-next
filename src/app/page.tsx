'use client';

import { useMissionControl } from '@/hooks/useMissionControl';
import MissionControlLayout from '@/components/mission-control/MissionControlLayout';
import MissionControlHeader from '@/components/mission-control/MissionControlHeader';
import AgentsPanel from '@/components/mission-control/AgentsPanel';
import KanbanPanel from '@/components/mission-control/KanbanPanel';
import ContentPanel from '@/components/mission-control/ContentPanel';
import FloatingAddButton from '@/components/mission-control/FloatingAddButton';

export default function MissionControlPage() {
  const mc = useMissionControl();

  return (
    <>
      <MissionControlLayout
      header={
        <MissionControlHeader
          metrics={mc.metrics}
          status={mc.status}
        />
      }
      leftPanel={
        <AgentsPanel
          agents={mc.agents}
          addTask={mc.addTask}
          loading={mc.loading}
          input={mc.input}
          setInput={mc.setInput}
        />
      }
      centerPanel={
        <KanbanPanel
          tasks={mc.tasks}
          updateTask={mc.updateTask}
          error={mc.error}
        />
      }
      rightPanel={
        <ContentPanel
          outputs={mc.outputs}
          geniusItems={mc.geniusItems}
          selectedOutputs={mc.selectedOutputs}
          toggleOutput={mc.toggleOutput}
          mergeOutputs={mc.mergeOutputs}
          result={mc.result}
          resultType={mc.resultType}
          processing={mc.processing}
          error={mc.error}
          generateSocial={mc.generateSocial}
          generateImage={mc.generateImage}
          generatePodcast={mc.generatePodcast}
          generateVideo={mc.generateVideo}
          copyResult={mc.copyResult}
        />
      }
      activePanel={mc.activePanel}
      setActivePanel={mc.setActivePanel}
    />

      {/* 手機版浮動新增按鈕 */}
      <FloatingAddButton onSubmit={mc.addTask} />
    </>
  );
}
