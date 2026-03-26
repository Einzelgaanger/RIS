/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'GVTS RIP'

interface WorkspaceInvitationProps {
  inviteeName?: string
  roleName?: string
  teamName?: string
  departmentName?: string
  inviterName?: string
  note?: string
  signupUrl?: string
}

const WorkspaceInvitationEmail = ({
  inviteeName,
  roleName,
  teamName,
  departmentName,
  inviterName,
  note,
  signupUrl,
}: WorkspaceInvitationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {inviterName
        ? `${inviterName} invited you to join ${SITE}`
        : `You've been invited to join ${SITE}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>{SITE}</Text>
          <Text style={tagline}>Resource Intelligence Platform</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>
          {inviteeName ? `Welcome, ${inviteeName}!` : "You're invited"}
        </Heading>
        <Text style={text}>
          {inviterName ? `${inviterName} has invited you` : "You've been invited"} to
          join the {SITE} workspace
          {roleName ? ` as a ${roleName}` : ''}
          {teamName ? ` on the ${teamName} team` : ''}
          {departmentName ? ` in ${departmentName}` : ''}.
        </Text>
        {note && (
          <Section style={noteSection}>
            <Text style={noteText}>"{note}"</Text>
            {inviterName && (
              <Text style={noteAuthor}>— {inviterName}</Text>
            )}
          </Section>
        )}
        <Text style={text}>
          Click the button below to create your account. Your role and team assignments
          will be applied automatically when you sign up.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={signupUrl || 'https://ris.vgg.app/login'}>
            Accept &amp; Create Account
          </Button>
        </Section>
        <Text style={hint}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>© {SITE} · Resource Intelligence Platform</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WorkspaceInvitationEmail,
  subject: (data: Record<string, any>) =>
    data.inviterName
      ? `${data.inviterName} invited you to join ${SITE}`
      : `You've been invited to join ${SITE}`,
  displayName: 'Workspace invitation',
  previewData: {
    inviteeName: 'Jane Doe',
    roleName: 'Manager',
    teamName: 'Delivery',
    departmentName: 'Engineering',
    inviterName: 'John Admin',
    note: 'Looking forward to having you on the team!',
    signupUrl: 'https://ris.vgg.app/login',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '8px', margin: '40px auto', padding: '0', maxWidth: '480px', border: '1px solid #e2e6ed' }
const header = { padding: '28px 32px 0', textAlign: 'center' as const }
const logo = { fontSize: '20px', fontWeight: '700' as const, color: '#0055B3', margin: '0', letterSpacing: '-0.3px' }
const tagline = { fontSize: '11px', color: '#47536B', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const divider = { borderColor: '#e2e6ed', margin: '20px 32px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#161E2E', margin: '0 32px 16px', padding: '0' }
const text = { fontSize: '14px', color: '#47536B', lineHeight: '1.6', margin: '0 32px 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 32px 24px' }
const button = { backgroundColor: '#0055B3', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 28px', textDecoration: 'none' }
const hint = { fontSize: '12px', color: '#8090a7', lineHeight: '1.5', margin: '0 32px 24px' }
const footer = { fontSize: '11px', color: '#8090a7', textAlign: 'center' as const, margin: '0', padding: '0 32px 28px' }
const noteSection = { backgroundColor: '#f7f8fa', borderRadius: '8px', margin: '0 32px 20px', padding: '16px 20px' }
const noteText = { fontSize: '14px', color: '#47536B', fontStyle: 'italic' as const, margin: '0 0 4px', lineHeight: '1.5' }
const noteAuthor = { fontSize: '12px', color: '#8090a7', margin: '0' }
