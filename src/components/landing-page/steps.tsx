import Image from "next/image";

export default function StepsSection() {
  return (
    <section>
      <div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2]">
        <div className="pt-15 md:pt-18 lg:pt-30 border-x">
          <div className="flex flex-col gap-4 lg:gap-6 items-center mb-10 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-full before:h-px before:bg-border">
            <h2 className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold text-center text-pretty max-w-[20rem] md:max-w-[31.25rem]">
              The meeting is over. Your insights are just beginning.
            </h2>
            <p className="text-sm md:text-base text-center text-pretty text-muted-foreground max-w-[22rem] md:max-w-[28rem]">
              Connect your calendar, we&apos;ll handle the rest. Your key
              conversation points, captured and organized automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Space */}
      <div className="hidden relative md:grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-y">
        <div className="h-12 border-x" />
      </div>

      {/* Steps */}
      <div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="border-x">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="flex flex-col justify-between lg:border-r">
              <div className="aspect-[1/0.64] md:aspect-[15/5] lg:aspect-[1/0.64] relative">
                <div className="size-full bg-oceanic-noir relative overflow-hidden">
                  <span className="text-[13.25rem] font-medium text-muted-foreground/30 absolute -bottom-24 -right-6">
                    01
                  </span>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold mb-1.5">
                  Connect Calendar
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Link your google and we&apos;ll automatically detect your
                  meetings
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-between lg:border-x">
              <div className="aspect-[1/0.64] md:aspect-[15/5] lg:aspect-[1/0.64] relative">
                <div className="size-full bg-oceanic-noir relative overflow-hidden">
                  <span className="text-[13.25rem] font-medium text-muted-foreground/30 absolute -bottom-22 -right-6">
                    02
                  </span>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold mb-1.5">
                  Vorcle Joins Meeting
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Our AI bot joins your meeting and captures key conversation
                  points with full transcription.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-between lg:border-l">
              <div className="aspect-[1/0.64] md:aspect-[15/5] lg:aspect-[1/0.64] relative">
                <div className="size-full bg-oceanic-noir relative overflow-hidden">
                  <span className="text-[13.25rem] font-medium text-muted-foreground/30 absolute -bottom-24 -right-6">
                    03
                  </span>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold mb-1.5">Get Insights</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Receive summaries, transcripts, action items and push them to
                  your favourite tools instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Showcase */}
      <div className="relative border-b">
        <div className="h-15 md:h-18 lg:h-30 w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto border-x" />
        <div className="relative">
          <div className="before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-1/2 before:w-full before:h-px before:bg-border" />
          <div className="relative w-full mask-b-from-1% overflow-hidden max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto border-x">
            <Image
              alt="App calendar screenshot"
              src="/images/landing-calendar.webp"
              width="1900"
              height="951"
              priority
              className="relative"
            />
          </div>
          <div className="after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-full after:h-px after:bg-border" />
        </div>
        <div className="w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto border-x">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold p-4 lg:p-6 border-b">
            All Your Events, One Clear View
          </h3>
          <p className="text-muted-foreground text-sm md:text-base p-4 lg:p-6 max-w-[31.25rem] text-pretty">
            Save events that are important to you. We&apos;ll keep them
            organized and remind you when it counts.
          </p>
        </div>
      </div>
    </section>
  );
}
