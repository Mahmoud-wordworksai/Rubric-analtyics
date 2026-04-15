/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import * as React from "react";

type AgentCardProps = {
  imageUrl: string;
  badgeText: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
};

/**
 * AgentCard component - Dynamic version
 */
const AgentCard = ({
  imageUrl,
  badgeText,
  title,
  description,
  linkText,
  linkHref,
}: AgentCardProps) => {
  return (
    <Link href={linkHref} className="flex flex-col items-start px-6 max-w-[462px] rounded-xl border border-stone-200">
      <article className="overflow-hidden p-6 w-full rounded-xl">
        <AgentCardImage imageUrl={imageUrl} />
        <AgentCardContent
          badgeText={badgeText}
          title={title}
          description={description}
          linkText={linkText}
          linkHref={linkHref}
        />
      </article>
    </Link>
  );
};

const AgentCardImage = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <figure className="w-full">
      <img
        src={imageUrl}
        alt="Agent visual"
        className="object-contain w-full rounded-xl aspect-[1.42]"
      />
    </figure>
  );
};

const AgentCardBadge = ({ badgeText }: { badgeText: string }) => {
  return (
    <span className="overflow-hidden gap-1 self-stretch px-2.5 py-1.5 text-xs tracking-tight leading-none text-center rotate-[4.135903555803204e-25rad] rounded-[56px]">
      {badgeText}
    </span>
  );
};

type AgentCardContentProps = {
  badgeText: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
};

const AgentCardContent = ({
  badgeText,
  title,
  description,
  linkText,
  linkHref,
}: AgentCardContentProps) => {
  return (
    <div className="flex flex-col items-start mt-6 w-full">
      <AgentCardBadge badgeText={badgeText} />
      <div className="mt-4 w-full">
        <h2 className="text-2xl font-semibold tracking-tighter leading-8">
          {title}
        </h2>
        <p className="mt-2 text-xs tracking-tight leading-5 text-stone-500">
          {description}
        </p>
      </div>
      <a
        href={linkHref}
        className="self-stretch mt-4 text-sm font-medium tracking-tight leading-none"
      >
        {linkText}
      </a>
    </div>
  );
};

export default AgentCard;
