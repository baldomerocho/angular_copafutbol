import { Component, inject } from '@angular/core';
import { ConfigService } from '../../pages/service/config.service';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <span>{{ config.platformName() }}</span>
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
