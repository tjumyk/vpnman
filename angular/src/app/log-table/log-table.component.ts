import {Component, Input, OnInit} from '@angular/core';
import {OpenVPNLogLine} from "../models";

@Component({
  selector: 'app-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.less']
})
export class LogTableComponent implements OnInit {
  @Input() log: OpenVPNLogLine[];

  /*
  * Flags:
  *   D -- debug
  *   I -- informational
  *   W -- warning
  *   N -- non-fatal error
  *   F -- fatal error
  */
  level_flags = ['', 'D', 'I', 'W', 'N', 'F'];
  flag_levels = {};

  constructor() {
    for(let i in this.level_flags){
      let flag = this.level_flags[i];
      this.flag_levels[flag] = i;
    }
  }

  ngOnInit() {
    if (this.log) {
      for (let line of this.log) {
        let max_level = 0;
        for (let i = 0; i < line.flags.length; ++i) {
          let level = this.flag_levels[line.flags[i]];
          if (level > max_level){
            max_level = level;
          }
        }
        line['_max_level'] = max_level
      }
    }
  }

}
