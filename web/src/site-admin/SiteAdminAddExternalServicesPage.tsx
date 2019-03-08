import * as H from 'history'
import React from 'react'
import { noop } from 'rxjs'
import { LinkOrButton } from '../../../shared/src/components/LinkOrButton'
import { ExternalServiceKind } from '../../../shared/src/graphql/schema'
import * as GQL from '../../../shared/src/graphql/schema'
import { PageTitle } from '../components/PageTitle'
import { ThemeProps } from '../theme'
import { getExternalService } from './externalServices'
import { SiteAdminExternalServiceForm } from './SiteAdminExternalServiceForm2'

interface SiteAdminAddExternalServiceProps extends ThemeProps {
    history: H.History
    kind: ExternalServiceKind
    title: string
    submitText: string
    displayName: string
    helpElement?: JSX.Element | string
}

interface SiteAdminAddExternalServiceState {}

// function externalServicePropsForKind(kind: ExternalServiceKind): SiteAdminAddExternalServiceProps | null {
// }

export class SiteAdminAddExternalServicePage extends React.Component<
    SiteAdminAddExternalServiceProps,
    SiteAdminAddExternalServiceState
> {
    // private getExternalServiceInput(): GQL.IAddExternalServiceInput {
    //     return this.getExternalServiceKind()
    //         ? {
    //               displayName: this.state.displayName,
    //               config: this.state.config,
    //               kind: this.getExternalServiceKind(),
    //           }
    //         : null
    // }

    public render(): JSX.Element | null {
        return (
            <div className="add-external-service-page">
                <PageTitle title={this.props.title} />
                <h1>{this.props.title}</h1>
                {this.props.helpElement ? <div>{this.props.helpElement}</div> : undefined}
                <SiteAdminExternalServiceForm
                    // error={this.state.error}
                    input={{
                        displayName: this.props.displayName,
                        config: 'TODO: config',
                        kind: this.props.kind,
                    }}
                    {...this.props}
                    mode="create"
                    loading={false}
                    onSubmit={noop}
                    onChange={noop}
                    // loading={this.state.loading}
                    // onSubmit={this.onSubmit}
                    // onChange={this.onChange}
                />
            </div>
        )
    }
}

interface SiteAdminAddExternalServicesProps extends ThemeProps {
    history: H.History
    eventLogger: {
        logViewEvent: (event: 'AddExternalService') => void
        log: (event: 'AddExternalServiceFailed' | 'AddExternalServiceSucceeded', eventProperties?: any) => void
    }
}

interface SiteAdminAddExternalServicesState {}

interface ButtonProps {
    kind: ExternalServiceKind
    text: string
    secondaryKind?: string // TODO(beyang): e.g., github.com vs GH Enterprise, populate with different default config
}

export class SiteAdminAddExternalServicesPage extends React.Component<
    SiteAdminAddExternalServicesProps,
    SiteAdminAddExternalServicesState
> {
    private getExternalServiceKind(): GQL.ExternalServiceKind | null {
        const params = new URLSearchParams(this.props.history.location.search)
        let kind = params.get('kind') || undefined
        if (kind) {
            kind = kind.toUpperCase()
        }
        const isKnownKind = (kind: string): kind is GQL.ExternalServiceKind =>
            !!getExternalService(kind as GQL.ExternalServiceKind)
        return kind && isKnownKind(kind) ? kind : null
    }

    public render(): JSX.Element | null {
        const kind = this.getExternalServiceKind()
        if (kind) {
            return (
                <SiteAdminAddExternalServicePage
                    {...this.props}
                    title="TODO: title"
                    displayName="TODO: displayName"
                    submitText="TODO: submit"
                    helpElement="TODO: help"
                    kind={ExternalServiceKind.GITHUB}
                />
            )
        } else {
            const buttons: ButtonProps[] = [
                {
                    kind: ExternalServiceKind.AWSCODECOMMIT,
                    text: 'Add repositories from AWS CodeCommit',
                },
                {
                    kind: ExternalServiceKind.GITHUB,
                    text: 'Add repositories from GitHub Enterprise',
                },
                {
                    kind: ExternalServiceKind.GITHUB,
                    text: 'Add repositories from GitHub.com',
                },
                {
                    kind: ExternalServiceKind.GITLAB,
                    text: 'Add projects from GitLab',
                },
                {
                    kind: ExternalServiceKind.BITBUCKETSERVER,
                    text: 'Add repositories from Bitbucket Server',
                },
                {
                    kind: ExternalServiceKind.GITOLITE,
                    text: 'Add repositories from Gitolite',
                },
                {
                    kind: ExternalServiceKind.OTHER,
                    text: 'Add repositories by Git clone URL',
                },
                {
                    kind: ExternalServiceKind.PHABRICATOR,
                    text: 'Link with Phabricator',
                },
            ]
            return (
                <div className="add-external-services-page">
                    <PageTitle title="Choose an external service type to add" />
                    <h1>Add external service</h1>
                    {buttons.map((button, i) => (
                        <LinkOrButton key={i} to={`?kind=${button.kind.toLowerCase()}`}>
                            <button className="btn btn-primary e2e-add-external-service-button add-external-services-page__button">
                                {button.text}
                            </button>
                        </LinkOrButton>
                    ))}
                </div>
            )
        }
    }
}
