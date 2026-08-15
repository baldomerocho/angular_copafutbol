import { Component, inject } from '@angular/core';
import { ConfigService } from '../../pages/service/config.service';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        @if (config.appConfig()?.website_url) {
            <a [href]="config.appConfig()?.website_url" target="_blank" rel="noopener"
               class="text-primary hover:underline">{{ config.platformName() }}</a>
        } @else {
            <span>{{ config.platformName() }}</span>
        }
        @if (config.appConfig()?.contact_email) {
            <span class="mx-2 text-muted-color">·</span>
            <a [href]="'mailto:' + config.appConfig()?.contact_email" class="text-primary hover:underline">
                {{ config.appConfig()?.contact_email }}
            </a>
        }
    </div>`
})
export class AppFooter {
    readonly config = inject(ConfigService);
}
